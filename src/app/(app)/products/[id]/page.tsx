import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { money, ownedProduct, productOutline, productSections, wordCount } from "@/lib/products";
import { paymentsLive } from "@/lib/payments";
import { updateProduct, setPublished, deleteProduct, addSection } from "@/app/actions/products";
import { SectionEditor } from "@/app/components/SectionEditor";
import { OutlineButton } from "@/app/components/OutlineButton";
import { Cover } from "@/app/components/Cover";
import { ConfirmButton } from "@/app/components/ConfirmButton";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const p = await ownedProduct(user.id, id);
  if (!p) notFound();
  const sections = await productSections(p.id);
  const outline = productOutline(p);
  const words = sections.reduce((n, s) => n + wordCount(s.content), 0);
  const drafted = sections.filter((s) => wordCount(s.content) > 0).length;
  const partners = await all<{ id: string; name: string; split_pct: number }>("SELECT id, name, split_pct FROM partners WHERE user_id = ? ORDER BY name", user.id);
  const sales = (await get<{ n: number; total: number }>("SELECT COUNT(*) AS n, COALESCE(SUM(amount_cents),0) AS total FROM orders WHERE product_id = ? AND status = 'paid'", p.id))!;
  const assets = (await get<{ n: number }>("SELECT COUNT(*) AS n FROM assets WHERE product_id = ?", p.id))!.n;
  const partner = partners.find((x) => x.id === p.partner_id);

  return (
    <>
      <p className="small"><Link href="/products">Products</Link></p>
      <div className="page-head">
        <div>
          <h1>{p.title}</h1>
          <div className="row small">
            <span className={`badge ${p.status === "published" ? "good" : ""}`}>{p.status}</span>
            <span className="muted">{p.kind} · {money(p.price_cents)} · {words.toLocaleString()} words · {drafted}/{sections.length} sections drafted</span>
          </div>
        </div>
        <div className="row">
          {p.status === "published" && <Link className="btn" href={`/p/${p.slug}`} target="_blank">View store page</Link>}
          <form action={setPublished}>
            <input type="hidden" name="id" value={p.id} />
            <button className={`btn${p.status === "published" ? "" : " primary"}`}>{p.status === "published" ? "Unpublish" : "Publish to store"}</button>
          </form>
        </div>
      </div>

      {p.status === "published" && (
        <div className="notice info">
          Live at <code>/p/{p.slug}</code>{paymentsLive() ? "" : " in test mode (no STRIPE_SECRET_KEY): purchases are simulated"}.
        </div>
      )}

      <div className="grid grid-4">
        <div className="card stat"><div className="stat-label">Sales</div><div className="stat-value">{sales.n}</div></div>
        <div className="card stat"><div className="stat-label">Revenue</div><div className="stat-value">{money(sales.total)}</div></div>
        <div className="card stat"><div className="stat-label">{partner ? `Your share (${100 - partner.split_pct}%)` : "Your share"}</div><div className="stat-value">{money(partner ? Math.round((sales.total * (100 - partner.split_pct)) / 100) : sales.total)}</div></div>
        <div className="card stat"><div className="stat-label">Launch assets</div><div className="stat-value">{assets} <Link href={`/studio?product=${p.id}`} className="small">+ add</Link></div></div>
      </div>

      <div className="grid mt" style={{ gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)", alignItems: "start" }}>
        <div className="stack">
          <div className="card">
            <div className="spread">
              <h2 style={{ margin: 0 }}>Content</h2>
              <OutlineButton productId={p.id} hasSections={sections.length > 0} />
            </div>
            {outline && (
              <p className="small muted mt" style={{ marginBottom: 0 }}>
                <strong>Suggested price:</strong> ${outline.price_usd}. {outline.pricing_rationale}
                {outline.bonuses.length > 0 && <> <strong>Bonus ideas:</strong> {outline.bonuses.join("; ")}.</>}
              </p>
            )}
            {sections.length === 0 && <p className="muted mt" style={{ marginBottom: 0 }}>Generate an outline to get a section plan, or add sections yourself below.</p>}
          </div>
          {sections.map((s, i) => <SectionEditor key={s.id} section={s} index={i} total={sections.length} />)}
          <form action={addSection} className="card row" style={{ padding: 12 }}>
            <input type="hidden" name="id" value={p.id} />
            <input type="text" name="title" placeholder="New section title" style={{ flex: 1, minWidth: 180 }} />
            <button className="btn">Add section</button>
          </form>
          {words > 0 && words < 1500 && <div className="notice">Reviewers of AI-built products agree the raw drafts read as generic. Add your own examples and edit every section before you publish.</div>}
        </div>

        <form action={updateProduct} className="card">
          <input type="hidden" name="id" value={p.id} />
          <h2>Store listing</h2>
          <div style={{ maxWidth: 160, marginBottom: 12 }}><Cover title={p.title} tagline={p.tagline} hue={p.cover_hue} kind={p.kind} /></div>
          <div className="field"><label>Title</label><input type="text" name="title" defaultValue={p.title} /></div>
          <div className="field"><label>Tagline</label><input type="text" name="tagline" defaultValue={p.tagline} /></div>
          <div className="grid grid-2">
            <div className="field"><label>Price (USD)</label><input type="number" name="price" min={0} step={1} defaultValue={p.price_cents / 100} /></div>
            <div className="field"><label>Cover colour</label><input type="range" name="cover_hue" min={0} max={359} defaultValue={p.cover_hue} /></div>
          </div>
          <div className="field"><label>Buyer</label><input type="text" name="audience" defaultValue={p.audience} /></div>
          <div className="field"><label>Problem</label><input type="text" name="problem" defaultValue={p.problem} /></div>
          <div className="field"><label>Promised result</label><input type="text" name="promise" defaultValue={p.promise} /></div>
          <div className="field"><label>Description <span className="hint">(Markdown)</span></label><textarea name="description" defaultValue={p.description} style={{ minHeight: 180 }} /></div>
          <div className="field"><label>Creator partner</label>
            <select name="partner_id" defaultValue={p.partner_id ?? ""}>
              <option value="">None</option>
              {partners.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.split_pct}% to partner)</option>)}
            </select>
          </div>
          <button className="btn primary">Save listing</button>
          <hr />
          <div className="row">
            <Link className="btn small" href={`/distribution?product=${p.id}`}>Find buyers</Link>
            <Link className="btn small" href={`/review?product=${p.id}`}>Launch review</Link>
          </div>
        </form>
      </div>
      <form action={deleteProduct} className="mt-lg">
        <input type="hidden" name="id" value={p.id} />
        <ConfirmButton message="Delete this product, its content and its sales records?">Delete product</ConfirmButton>
      </form>
      <style>{`@media (max-width: 960px) { .grid[style*="1.6fr"] { grid-template-columns: 1fr !important; } }`}</style>
    </>
  );
}
