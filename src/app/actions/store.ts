"use server";
import { redirect } from "next/navigation";
import { get } from "@/lib/db";
import { startCheckout } from "@/lib/payments";
import type { Product } from "@/lib/products";

export async function buy(form: FormData) {
  const slug = String(form.get("slug") ?? "");
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const product = await get<Product>("SELECT * FROM products WHERE slug = ? AND status = 'published'", slug);
  if (!product) redirect("/");
  if (!/^\S+@\S+\.\S+$/.test(email)) redirect(`/p/${slug}?error=email`);
  const next = await startCheckout(product, email);
  redirect(next);
}
