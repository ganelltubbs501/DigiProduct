import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";
import { deleteAsset } from "@/app/actions/studio";
import { Studio } from "@/app/components/Studio";
import { AssetBody } from "@/app/components/AssetCard";
import { ProductPicker } from "@/app/components/ProductPicker";

export const metadata = { title: "Launch Studio" };

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const user = await requireUser();
  const products = await all<{ id: string; title: string }>("SELECT id, title FROM products WHERE user_id = ? ORDER BY created_at DESC", user.id);
  const { product } = await searchParams;
  const selected = products.find((p) => p.id === product) ?? products[0];

  if (!selected)
    return (
      <>
        <h1>Launch Studio</h1>
        <div className="card"><p>Create a product first. Every agent writes from your product brief.</p><Link className="btn primary" href="/products/new">New product</Link></div>
      </>
    );

  const assets = await all<{ id: string; agent_key: string; title: string; content: string; created_at: string }>(
    "SELECT id, agent_key, title, content, created_at FROM assets WHERE product_id = ? AND user_id = ? ORDER BY created_at DESC",
    selected.id, user.id,
  );

  return (
    <>
      <div className="page-head">
        <div><h1>Launch Studio</h1><p>Specialised agents for positioning, sales pages, emails, ads, social, outreach and support. Each writes from your product brief, and you edit the result.</p></div>
        <ProductPicker products={products} selected={selected.id} basePath="/studio" />
      </div>
      <Studio key={selected.id} productId={selected.id} doneKeys={[...new Set(assets.map((a) => a.agent_key))]} />
      <h2 className="mt-lg">Saved assets for {selected.title} ({assets.length})</h2>
      {assets.length === 0 && <p className="muted">Nothing yet. Start with Positioning Statement, then Sales Page.</p>}
      <div className="stack">
        {assets.map((a) => (
          <details key={a.id} className="card">
            <summary className="spread" style={{ cursor: "pointer" }}>
              <strong>{a.title}</strong>
              <span className="small muted">{new Date(a.created_at).toLocaleString()}</span>
            </summary>
            <AssetBody id={a.id} content={a.content} html={renderMarkdown(a.content)} />
            <form action={deleteAsset} className="mt"><input type="hidden" name="id" value={a.id} /><button className="btn small danger">Delete</button></form>
          </details>
        ))}
      </div>
    </>
  );
}
