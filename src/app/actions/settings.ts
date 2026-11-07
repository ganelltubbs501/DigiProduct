"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { run } from "@/lib/db";

export async function saveSettings(form: FormData) {
  const user = await requireUser();
  const name = String(form.get("name") ?? "").trim().slice(0, 120) || user.name;
  run(
    "UPDATE users SET name = ?, skills = ?, leaderboard_opt_in = ? WHERE id = ?",
    name, String(form.get("skills") ?? "").trim().slice(0, 2000), form.get("leaderboard") === "on" ? 1 : 0, user.id,
  );
  revalidatePath("/", "layout");
}
