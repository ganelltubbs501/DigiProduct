import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { money, userProducts } from "@/lib/products";
import { Cover } from "@/app/components/Cover";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  const user = await requireUser();
  const products = await userProducts(user.id);
  return (
    <>
      <div className="page-head">
        <div><h1>Products</h1><p>Everything you&apos;re building and selling.</p></div>
        <Link href="/products/new" className="btn primary">New product</Link>
      </div>
      {products.length === 0 ? (
        <div className="card">
          <p>No products yet.</p>
          <div className="row"><Link href="/research" className="btn primary">Find an idea in Demand Lab</Link><Link href="/products/new" className="btn">Start from scratch</Link></div>
        </div>
      ) : (
        <div className="grid grid-3">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`} className="card" style={{ color: "var(--text)", textDecoration: "none" }}>
              <div style={{ maxWidth: 150 }}><Cover title={p.title} hue={p.cover_hue} kind={p.kind} /></div>
              <div className="spread mt"><strong>{p.title}</strong></div>
              <div className="row mt small">
                <span className={`badge ${p.status === "published" ? "good" : ""}`}>{p.status}</span>
                <span className="muted">{money(p.price_cents)}</span>
                <span className="muted">· {p.words.toLocaleString()} words</span>
                <span className="muted">· {p.orders} sales</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
