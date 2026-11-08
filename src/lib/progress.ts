import "server-only";
import { all, count, get } from "./db";
import { ALL_LESSONS } from "./curriculum";

export type Journey = {
  ideas: number;
  topics: number;
  products: number;
  published: number;
  words: number;
  assets: number;
  channels: number;
  channelsActive: number;
  partners: number;
  partnersSigned: number;
  orders: number;
  revenueCents: number;
  lessonsDone: number;
  lessonsTotal: number;
  firstPublishedAt: string | null;
};

export async function journey(userId: string): Promise<Journey> {
  const c = (sql: string) => count(sql, userId);
  const [sections, sales, first, ideas, topics, products, published, assets, channels, channelsActive, partners, partnersSigned, lessonsDone] = await Promise.all([
    all<{ content: string }>("SELECT s.content FROM sections s JOIN products p ON p.id = s.product_id WHERE p.user_id = ?", userId),
    get<{ n: number; total: number }>(
      "SELECT COUNT(*) AS n, COALESCE(SUM(o.amount_cents),0) AS total FROM orders o JOIN products p ON p.id = o.product_id WHERE p.user_id = ? AND o.status = 'paid'",
      userId,
    ),
    get<{ t: string | null }>("SELECT MIN(published_at) AS t FROM products WHERE user_id = ? AND published_at IS NOT NULL", userId),
    c("SELECT COUNT(*) AS n FROM ideas WHERE user_id = ?"),
    c("SELECT COUNT(*) AS n FROM topics WHERE user_id = ?"),
    c("SELECT COUNT(*) AS n FROM products WHERE user_id = ?"),
    c("SELECT COUNT(*) AS n FROM products WHERE user_id = ? AND status = 'published'"),
    c("SELECT COUNT(*) AS n FROM assets WHERE user_id = ?"),
    c("SELECT COUNT(*) AS n FROM channels WHERE user_id = ?"),
    c("SELECT COUNT(*) AS n FROM channels WHERE user_id = ? AND status IN ('active','converting')"),
    c("SELECT COUNT(*) AS n FROM partners WHERE user_id = ?"),
    c("SELECT COUNT(*) AS n FROM partners WHERE user_id = ? AND stage IN ('signed','launched')"),
    c("SELECT COUNT(*) AS n FROM lesson_progress WHERE user_id = ?"),
  ]);
  return {
    ideas, topics, products, published, assets, channels, channelsActive, partners, partnersSigned, lessonsDone,
    words: sections.reduce((n, s) => n + (s.content.trim() ? s.content.trim().split(/\s+/).length : 0), 0),
    orders: sales?.n ?? 0,
    revenueCents: sales?.total ?? 0,
    lessonsTotal: ALL_LESSONS.length,
    firstPublishedAt: first?.t ?? null,
  };
}

export type Step = { done: boolean; label: string; href: string };

export function checklist(j: Journey): Step[] {
  return [
    { done: j.ideas + j.topics > 0, label: "Generate ideas or score a topic", href: "/research" },
    { done: j.products > 0, label: "Create your first product", href: "/products/new" },
    { done: j.words >= 1500, label: "Draft at least 1,500 words", href: "/products" },
    { done: j.assets >= 3, label: "Create 3 launch assets", href: "/studio" },
    { done: j.published > 0, label: "Publish to your store", href: "/products" },
    { done: j.channels >= 3, label: "Track 3 distribution channels", href: "/distribution" },
    { done: j.orders > 0, label: "Make your first sale", href: "/sales" },
  ];
}

export function nextStep(j: Journey): Step | undefined {
  return checklist(j).find((s) => !s.done);
}

export function daysSince(iso: string | null): number {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000);
}
