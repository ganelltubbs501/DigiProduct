"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { AIError } from "@/lib/ai";
import { get, id, now, run } from "@/lib/db";
import { ownedProduct, uniqueSlug } from "@/lib/products";
import { outlineProduct, PRODUCT_KINDS } from "@/lib/research";

function field(form: FormData, key: string, max = 2000) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

export async function createProduct(form: FormData) {
  const user = await requireUser();
  const title = field(form, "title", 200) || "Untitled product";
  const kindRaw = field(form, "kind");
  const kind = (PRODUCT_KINDS as readonly string[]).includes(kindRaw) ? kindRaw : "ebook";
  const price = Math.max(0, Math.round(Number(form.get("price") || 29) * 100));
  const partnerId = field(form, "partner_id") || null;
  const validPartner = partnerId && get("SELECT 1 FROM partners WHERE id = ? AND user_id = ?", partnerId, user.id) ? partnerId : null;
  const productId = id();
  run(
    `INSERT INTO products (id, user_id, partner_id, title, slug, kind, audience, problem, promise, price_cents, cover_hue, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    productId, user.id, validPartner, title, uniqueSlug(title), kind,
    field(form, "audience"), field(form, "problem"), field(form, "promise"), price,
    Math.floor(Math.random() * 360), now(),
  );
  redirect(`/products/${productId}`);
}

export type OutlineState = { error?: string } | undefined;

export async function generateOutline(_: OutlineState, form: FormData): Promise<OutlineState> {
  const user = await requireUser();
  const p = ownedProduct(user.id, String(form.get("id")));
  if (!p) return { error: "Product not found." };
  try {
    const outline = await outlineProduct(p);
    run("DELETE FROM sections WHERE product_id = ? AND content = ''", p.id);
    const start = get<{ n: number }>("SELECT COALESCE(MAX(position), 0) AS n FROM sections WHERE product_id = ?", p.id)?.n ?? 0;
    outline.sections.forEach((s, i) => {
      run("INSERT INTO sections (id, product_id, position, title, brief, content, updated_at) VALUES (?, ?, ?, ?, ?, '', ?)", id(), p.id, start + i + 1, s.title, s.brief, now());
    });
    run(
      "UPDATE products SET outline_json = ?, tagline = CASE WHEN tagline = '' THEN ? ELSE tagline END, description = CASE WHEN description = '' THEN ? ELSE description END WHERE id = ?",
      JSON.stringify(outline), outline.tagline, outline.description, p.id,
    );
    revalidatePath(`/products/${p.id}`);
    return {};
  } catch (err) {
    return { error: err instanceof AIError ? err.message : "Could not generate the outline." };
  }
}

export async function updateProduct(form: FormData) {
  const user = await requireUser();
  const p = ownedProduct(user.id, String(form.get("id")));
  if (!p) return;
  const title = field(form, "title", 200) || p.title;
  const partnerId = field(form, "partner_id") || null;
  const validPartner = partnerId && get("SELECT 1 FROM partners WHERE id = ? AND user_id = ?", partnerId, user.id) ? partnerId : null;
  run(
    `UPDATE products SET title = ?, slug = ?, audience = ?, problem = ?, promise = ?, tagline = ?, description = ?, price_cents = ?, partner_id = ?, cover_hue = ? WHERE id = ?`,
    title,
    title === p.title ? p.slug : uniqueSlug(title, p.id),
    field(form, "audience"), field(form, "problem"), field(form, "promise"),
    field(form, "tagline", 300), field(form, "description", 20000),
    Math.max(0, Math.round(Number(form.get("price") || 0) * 100)),
    validPartner,
    Math.max(0, Math.min(359, Number(form.get("cover_hue") || p.cover_hue))),
    p.id,
  );
  revalidatePath(`/products/${p.id}`);
}

export async function setPublished(form: FormData) {
  const user = await requireUser();
  const p = ownedProduct(user.id, String(form.get("id")));
  if (!p) return;
  if (p.status === "published") run("UPDATE products SET status = 'draft' WHERE id = ?", p.id);
  else run("UPDATE products SET status = 'published', published_at = COALESCE(published_at, ?) WHERE id = ?", now(), p.id);
  revalidatePath(`/products/${p.id}`);
  revalidatePath("/products");
}

export async function deleteProduct(form: FormData) {
  const user = await requireUser();
  run("DELETE FROM products WHERE id = ? AND user_id = ?", String(form.get("id")), user.id);
  redirect("/products");
}

function ownedSection(userId: string, sectionId: string) {
  return get<{ id: string; product_id: string; position: number }>(
    "SELECT s.id, s.product_id, s.position FROM sections s JOIN products p ON p.id = s.product_id WHERE s.id = ? AND p.user_id = ?",
    sectionId, userId,
  );
}

export async function saveSection(sectionId: string, data: { title: string; brief: string; content: string }) {
  const user = await requireUser();
  const s = ownedSection(user.id, sectionId);
  if (!s) return { ok: false };
  run("UPDATE sections SET title = ?, brief = ?, content = ?, updated_at = ? WHERE id = ?", data.title.slice(0, 300), data.brief.slice(0, 2000), data.content, now(), s.id);
  revalidatePath(`/products/${s.product_id}`);
  return { ok: true };
}

export async function addSection(form: FormData) {
  const user = await requireUser();
  const p = ownedProduct(user.id, String(form.get("id")));
  if (!p) return;
  const pos = (get<{ n: number }>("SELECT COALESCE(MAX(position), 0) AS n FROM sections WHERE product_id = ?", p.id)?.n ?? 0) + 1;
  run("INSERT INTO sections (id, product_id, position, title, brief, content, updated_at) VALUES (?, ?, ?, ?, ?, '', ?)", id(), p.id, pos, field(form, "title", 300) || "New section", field(form, "brief"), now());
  revalidatePath(`/products/${p.id}`);
}

export async function deleteSection(form: FormData) {
  const user = await requireUser();
  const s = ownedSection(user.id, String(form.get("id")));
  if (!s) return;
  run("DELETE FROM sections WHERE id = ?", s.id);
  revalidatePath(`/products/${s.product_id}`);
}

export async function moveSection(form: FormData) {
  const user = await requireUser();
  const s = ownedSection(user.id, String(form.get("id")));
  if (!s) return;
  const dir = form.get("dir") === "up" ? -1 : 1;
  const other = get<{ id: string; position: number }>(
    dir < 0
      ? "SELECT id, position FROM sections WHERE product_id = ? AND position < ? ORDER BY position DESC LIMIT 1"
      : "SELECT id, position FROM sections WHERE product_id = ? AND position > ? ORDER BY position ASC LIMIT 1",
    s.product_id, s.position,
  );
  if (!other) return;
  run("UPDATE sections SET position = ? WHERE id = ?", other.position, s.id);
  run("UPDATE sections SET position = ? WHERE id = ?", s.position, other.id);
  revalidatePath(`/products/${s.product_id}`);
}
