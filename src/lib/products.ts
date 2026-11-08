import "server-only";
import { all, get, parseJSON } from "./db";
import type { Outline } from "./research";

export type Product = {
  id: string;
  user_id: string;
  partner_id: string | null;
  title: string;
  slug: string;
  kind: string;
  audience: string;
  problem: string;
  promise: string;
  price_cents: number;
  status: "draft" | "published";
  outline_json: string;
  tagline: string;
  description: string;
  cover_hue: number;
  created_at: string;
  published_at: string | null;
};

export type Section = {
  id: string;
  product_id: string;
  position: number;
  title: string;
  brief: string;
  content: string;
  updated_at: string;
};

export async function ownedProduct(userId: string, productId: string): Promise<Product | undefined> {
  return await get<Product>("SELECT * FROM products WHERE id = ? AND user_id = ?", productId, userId);
}

export async function userProducts(userId: string): Promise<(Product & { orders: number; revenue_cents: number; words: number })[]> {
  const rows = await all<Product & { orders: number; revenue_cents: number }>(
    `SELECT p.*,
       (SELECT COUNT(*) FROM orders o WHERE o.product_id = p.id AND o.status = 'paid') AS orders,
       (SELECT COALESCE(SUM(amount_cents),0) FROM orders o WHERE o.product_id = p.id AND o.status = 'paid') AS revenue_cents
     FROM products p WHERE p.user_id = ? ORDER BY p.created_at DESC`,
    userId,
  );
  return Promise.all(rows.map(async (r) => ({ ...r, words: await productWords(r.id) })));
}

export async function productSections(productId: string): Promise<Section[]> {
  return await all<Section>("SELECT * FROM sections WHERE product_id = ? ORDER BY position", productId);
}

export async function productWords(productId: string): Promise<number> {
  return (await productSections(productId)).reduce((n, s) => n + wordCount(s.content), 0);
}

export function productOutline(p: Product): Outline | null {
  const o = parseJSON<Partial<Outline>>(p.outline_json, {});
  return o.sections ? (o as Outline) : null;
}

export function outlineText(sections: Pick<Section, "title" | "brief">[]): string {
  return sections.map((s, i) => `${i + 1}. ${s.title}: ${s.brief}`).join("\n");
}

export function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 60)
    .replace(/^-|-$/g, "");
  return base || "product";
}

export async function uniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let n = 2;
  while (await get("SELECT 1 FROM products WHERE slug = ? AND id != ?", slug, excludeId ?? "")) slug = `${base}-${n++}`;
  return slug;
}

export function money(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
