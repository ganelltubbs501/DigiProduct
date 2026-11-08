import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { get, run, id, now } from "./db";

export type User = {
  id: string;
  email: string;
  name: string;
  skills: string;
  leaderboard_opt_in: number;
  challenge_started_at: string | null;
  created_at: string;
};

const COOKIE = "dp_session";
const SESSION_DAYS = 30;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", token, userId, expires.toISOString());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await run("DELETE FROM sessions WHERE token = ?", token);
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const user = await get<User>(
    `SELECT u.id, u.email, u.name, u.skills, u.leaderboard_opt_in, u.challenge_started_at, u.created_at
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > ?`,
    token,
    now(),
  );
  return user ?? null;
}

/** For pages and server actions: returns the user or redirects to login. */
export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function createUser(email: string, name: string, password: string): Promise<string> {
  const userId = id();
  await run(
    "INSERT INTO users (id, email, name, password_hash, created_at, challenge_started_at) VALUES (?, ?, ?, ?, ?, ?)",
    userId,
    email.toLowerCase().trim(),
    name.trim(),
    hashPassword(password),
    now(),
    now(),
  );
  return userId;
}

export async function findUserForLogin(email: string, password: string): Promise<string | null> {
  const row = await get<{ id: string; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = ?",
    email.toLowerCase().trim(),
  );
  if (!row || !verifyPassword(password, row.password_hash)) return null;
  return row.id;
}
