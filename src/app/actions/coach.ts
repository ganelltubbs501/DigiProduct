"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { run } from "@/lib/db";

export async function clearCoach() {
  const user = await requireUser();
  run("DELETE FROM coach_messages WHERE user_id = ?", user.id);
  revalidatePath("/coach");
}
