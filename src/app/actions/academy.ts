"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { run, now } from "@/lib/db";
import { ALL_LESSONS } from "@/lib/curriculum";

export async function toggleLesson(form: FormData) {
  const user = await requireUser();
  const lessonId = String(form.get("lessonId"));
  if (!ALL_LESSONS.some((l) => l.id === lessonId)) return;
  if (form.get("done") === "1") await run("DELETE FROM lesson_progress WHERE user_id = ? AND lesson_id = ?", user.id, lessonId);
  else await run("INSERT INTO lesson_progress (user_id, lesson_id, completed_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING", user.id, lessonId, now());
  revalidatePath("/academy", "layout");
}
