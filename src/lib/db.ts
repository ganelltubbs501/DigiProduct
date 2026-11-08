import "server-only";
import path from "node:path";
import fs from "node:fs";
import { SCHEMA } from "./schema";
import { toPg } from "./sql";

/**
 * Postgres everywhere.
 * - DATABASE_URL set (production, e.g. Neon or Supabase on Vercel): postgres.js.
 * - Not set (local dev): PGlite, an embedded Postgres stored in ./data/pglite.
 *
 * Queries use `?` placeholders; they're converted to $1, $2... here.
 */

type SQLValue = string | number | null;
type Row = Record<string, unknown>;
type Driver = { query(sql: string, params: SQLValue[]): Promise<Row[]> };

declare global {
  var __dpDb: Promise<Driver> | undefined;
}

async function connect(): Promise<Driver> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { default: postgres } = await import("postgres");
    const sql = postgres(url, {
      // Transaction-mode poolers (Supabase, Neon "-pooler") don't support prepared statements.
      prepare: false,
      max: Number(process.env.DATABASE_POOL_MAX || 5),
      idle_timeout: 20,
      onnotice: () => {},
      // COUNT/SUM return int8; our values fit comfortably in a JS number.
      types: { int8: { to: 20, from: [20], serialize: (v: number) => String(v), parse: (v: string) => Number(v) } },
    });
    await sql.unsafe(SCHEMA);
    return { query: async (text, params) => [...(await sql.unsafe(text, params as never[]))] as Row[] };
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.PGLITE_PATH || path.join(process.cwd(), "data", "pglite");
  if (dir !== "memory://") fs.mkdirSync(path.dirname(dir), { recursive: true });
  const pg = new PGlite(dir, { parsers: { 20: (v: string) => Number(v) } });
  await pg.exec(SCHEMA);
  return { query: async (text, params) => (await pg.query<Row>(text, params)).rows };
}

function driver(): Promise<Driver> {
  if (!globalThis.__dpDb) {
    globalThis.__dpDb = connect().catch((err) => {
      globalThis.__dpDb = undefined; // retry on next request
      throw err;
    });
  }
  return globalThis.__dpDb;
}

export async function all<T>(sql: string, ...params: SQLValue[]): Promise<T[]> {
  return (await (await driver()).query(toPg(sql), params)) as T[];
}

export async function get<T>(sql: string, ...params: SQLValue[]): Promise<T | undefined> {
  return (await all<T>(sql, ...params))[0];
}

export async function run(sql: string, ...params: SQLValue[]): Promise<void> {
  await (await driver()).query(toPg(sql), params);
}

/** Convenience for `SELECT COUNT(*) AS n ...` style queries. */
export async function count(sql: string, ...params: SQLValue[]): Promise<number> {
  return Number((await get<{ n: number }>(sql, ...params))?.n ?? 0);
}

export function id(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

export function parseJSON<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
