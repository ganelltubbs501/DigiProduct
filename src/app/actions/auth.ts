"use server";
import { redirect } from "next/navigation";
import { createSession, createUser, destroySession, findUserForLogin } from "@/lib/auth";
import { get } from "@/lib/db";

export type FormState = { error?: string } | undefined;

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter a valid email." };
  if (!name) return { error: "Enter your name." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (await get("SELECT 1 FROM users WHERE email = ?", email.toLowerCase())) return { error: "An account with that email already exists." };
  const userId = await createUser(email, name, password);
  await createSession(userId);
  redirect("/dashboard");
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const userId = await findUserForLogin(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
  if (!userId) return { error: "Wrong email or password." };
  await createSession(userId);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
