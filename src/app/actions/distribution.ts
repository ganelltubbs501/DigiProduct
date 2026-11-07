"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { AIError } from "@/lib/ai";
import { id, now, run } from "@/lib/db";
import { findAudiences, type FinderResult } from "@/lib/distribution";
import { ownedProduct } from "@/lib/products";

import { CHANNEL_STATUSES } from "@/lib/constants";

export type FinderState = { result?: FinderResult; error?: string } | undefined;

export async function runFinder(_: FinderState, form: FormData): Promise<FinderState> {
  const user = await requireUser();
  const p = ownedProduct(user.id, String(form.get("product_id")));
  if (!p) return { error: "Pick a product first." };
  try {
    const result = await findAudiences(p);
    for (const c of result.channels) {
      run(
        "INSERT INTO channels (id, user_id, product_id, name, platform, url, est_audience, fit_notes, angle, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'idea', ?)",
        id(), user.id, p.id, c.name, c.platform, c.url, Math.max(0, Math.round(c.est_audience)), c.why_buyers_are_here, c.angle, now(),
      );
    }
    revalidatePath("/distribution");
    return { result };
  } catch (err) {
    return { error: err instanceof AIError ? err.message : "Audience search failed." };
  }
}

export async function addChannel(form: FormData) {
  const user = await requireUser();
  const p = ownedProduct(user.id, String(form.get("product_id")));
  const name = String(form.get("name") ?? "").trim();
  if (!p || !name) return;
  run(
    "INSERT INTO channels (id, user_id, product_id, name, platform, url, est_audience, fit_notes, angle, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, '', '', 'researching', ?)",
    id(), user.id, p.id, name, String(form.get("platform") ?? ""), String(form.get("url") ?? ""), Math.max(0, Number(form.get("est_audience") || 0)), now(),
  );
  revalidatePath("/distribution");
}

export async function setChannelStatus(form: FormData) {
  const user = await requireUser();
  const status = String(form.get("status"));
  if (!(CHANNEL_STATUSES as readonly string[]).includes(status)) return;
  run("UPDATE channels SET status = ? WHERE id = ? AND user_id = ?", status, String(form.get("id")), user.id);
  revalidatePath("/distribution");
}

export async function deleteChannel(form: FormData) {
  const user = await requireUser();
  run("DELETE FROM channels WHERE id = ? AND user_id = ?", String(form.get("id")), user.id);
  revalidatePath("/distribution");
}
