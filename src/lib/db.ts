import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA } from "./schema";

type SQLValue = string | number | bigint | null | Uint8Array;

declare global {
  var __dpDb: DatabaseSync | undefined;
}

function open(): DatabaseSync {
  const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "digiproduct.db");
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA);
  return db;
}

export function db(): DatabaseSync {
  // Reuse one connection across hot reloads in dev.
  if (!globalThis.__dpDb) globalThis.__dpDb = open();
  return globalThis.__dpDb;
}

// node:sqlite returns null-prototype rows; React can't serialise those to
// client components, so copy them into plain objects.
export function all<T>(sql: string, ...params: SQLValue[]): T[] {
  return db().prepare(sql).all(...params).map((r) => ({ ...r }) as T);
}

export function get<T>(sql: string, ...params: SQLValue[]): T | undefined {
  const row = db().prepare(sql).get(...params);
  return row ? ({ ...row } as T) : undefined;
}

export function run(sql: string, ...params: SQLValue[]) {
  return db().prepare(sql).run(...params);
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
