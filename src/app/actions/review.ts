"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { AIError } from "@/lib/ai";
import { all, get, id, now, run } from "@/lib/db";
import { ownedProduct, productSections, wordCount } from "@/lib/products";
import { reviewLaunch } from "@/lib/review";
import { daysSince } from "@/lib/progress";

export type ReviewState = { error?: string } | undefined;

export async function runReview(_: ReviewState, form: FormData): Promise<ReviewState> {
  const user = await requireUser();
  const p = ownedProduct(user.id, String(form.get("product_id")));
  if (!p) return { error: "Pick a product." };
  const sections = productSections(p.id);
  try {
    const report = await reviewLaunch({
      title: p.title,
      kind: p.kind,
      audience: p.audience,
      problem: p.problem,
      promise: p.promise,
      price: p.price_cents / 100,
      tagline: p.tagline,
      description: p.description,
      sectionTitles: sections.map((s) => s.title),
      wordCount: sections.reduce((n, s) => n + wordCount(s.content), 0),
      daysLive: daysSince(p.published_at),
      orders: get<{ n: number }>("SELECT COUNT(*) AS n FROM orders WHERE product_id = ? AND status = 'paid'", p.id)!.n,
      channels: all<{ name: string; status: string }>("SELECT name, status FROM channels WHERE product_id = ?", p.id),
      assets: all<{ title: string }>("SELECT title FROM assets WHERE product_id = ?", p.id).map((a) => a.title),
    });
    run("INSERT INTO reviews (id, user_id, product_id, report_json, created_at) VALUES (?, ?, ?, ?, ?)", id(), user.id, p.id, JSON.stringify(report), now());
    revalidatePath("/review");
    return {};
  } catch (err) {
    return { error: err instanceof AIError ? err.message : "The review failed." };
  }
}
