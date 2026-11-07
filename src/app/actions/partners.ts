"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { get, id, now, run } from "@/lib/db";
import { PARTNER_STAGES } from "@/lib/constants";

const f = (form: FormData, k: string, max = 2000) => String(form.get(k) ?? "").trim().slice(0, max);
const split = (form: FormData) => Math.max(0, Math.min(100, Math.round(Number(form.get("split_pct") || 50))));

export async function createPartner(form: FormData) {
  const user = await requireUser();
  const name = f(form, "name", 200);
  if (!name) return;
  const pid = id();
  run(
    `INSERT INTO partners (id, user_id, name, handle, platform, audience_size, niche, email, stage, split_pct, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'prospect', ?, ?, ?, ?)`,
    pid, user.id, name, f(form, "handle"), f(form, "platform"), Math.max(0, Number(form.get("audience_size") || 0)),
    f(form, "niche"), f(form, "email"), split(form), f(form, "notes", 10000), now(), now(),
  );
  run("INSERT INTO partner_activities (id, partner_id, kind, note, created_at) VALUES (?, ?, 'created', 'Added to pipeline', ?)", id(), pid, now());
  revalidatePath("/partners");
}

export async function updatePartner(form: FormData) {
  const user = await requireUser();
  const pid = f(form, "id");
  if (!get("SELECT 1 FROM partners WHERE id = ? AND user_id = ?", pid, user.id)) return;
  run(
    "UPDATE partners SET name = ?, handle = ?, platform = ?, audience_size = ?, niche = ?, email = ?, split_pct = ?, notes = ?, updated_at = ? WHERE id = ?",
    f(form, "name", 200), f(form, "handle"), f(form, "platform"), Math.max(0, Number(form.get("audience_size") || 0)),
    f(form, "niche"), f(form, "email"), split(form), f(form, "notes", 10000), now(), pid,
  );
  revalidatePath(`/partners/${pid}`);
}

export async function setStage(form: FormData) {
  const user = await requireUser();
  const pid = f(form, "id");
  const stage = f(form, "stage");
  const row = get<{ stage: string }>("SELECT stage FROM partners WHERE id = ? AND user_id = ?", pid, user.id);
  if (!row || !PARTNER_STAGES.some((s) => s.key === stage) || row.stage === stage) return;
  run("UPDATE partners SET stage = ?, updated_at = ? WHERE id = ?", stage, now(), pid);
  run("INSERT INTO partner_activities (id, partner_id, kind, note, created_at) VALUES (?, ?, 'stage', ?, ?)", id(), pid, `Moved from ${row.stage} to ${stage}`, now());
  revalidatePath("/partners");
  revalidatePath(`/partners/${pid}`);
}

export async function logActivity(form: FormData) {
  const user = await requireUser();
  const pid = f(form, "id");
  const note = f(form, "note");
  if (!note || !get("SELECT 1 FROM partners WHERE id = ? AND user_id = ?", pid, user.id)) return;
  const kind = ["note", "message", "call", "email"].includes(f(form, "kind")) ? f(form, "kind") : "note";
  run("INSERT INTO partner_activities (id, partner_id, kind, note, created_at) VALUES (?, ?, ?, ?, ?)", id(), pid, kind, note, now());
  run("UPDATE partners SET updated_at = ? WHERE id = ?", now(), pid);
  revalidatePath(`/partners/${pid}`);
}

export async function deletePartner(form: FormData) {
  const user = await requireUser();
  run("DELETE FROM partners WHERE id = ? AND user_id = ?", f(form, "id"), user.id);
  redirect("/partners");
}
