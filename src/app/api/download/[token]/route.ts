import { get } from "@/lib/db";
import { orderByToken } from "@/lib/payments";
import { productSections, slugify, type Product } from "@/lib/products";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const order = await orderByToken((await params).token);
  if (!order || order.status !== "paid") return new Response("Not found", { status: 404 });
  const product = await get<Product>("SELECT * FROM products WHERE id = ?", order.product_id);
  if (!product) return new Response("Not found", { status: 404 });
  const body = [
    `# ${product.title}`,
    product.tagline ? `_${product.tagline}_` : "",
    ...(await productSections(product.id)).map((s) => (s.content.trim() ? s.content.trim() : `## ${s.title}\n\n(Coming soon)`)),
  ]
    .filter(Boolean)
    .join("\n\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slugify(product.title)}.md"`,
    },
  });
}
