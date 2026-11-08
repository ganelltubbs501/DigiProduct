import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { addChannel, deleteChannel, setChannelStatus } from "@/app/actions/distribution";
import { CHANNEL_STATUSES } from "@/lib/constants";
import { Finder } from "@/app/components/Finder";
import { ProductPicker } from "@/app/components/ProductPicker";

export const metadata = { title: "Audience Finder" };

const TONE: Record<string, string> = { idea: "", researching: "warn", active: "ok", converting: "good", dropped: "bad" };

export default async function DistributionPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const user = await requireUser();
  const products = await all<{ id: string; title: string }>("SELECT id, title FROM products WHERE user_id = ? ORDER BY created_at DESC", user.id);
  const { product } = await searchParams;
  const selected = products.find((p) => p.id === product) ?? products[0];
  if (!selected)
    return (<><h1>Audience Finder</h1><div className="card"><p>Create a product first.</p><Link className="btn primary" href="/products/new">New product</Link></div></>);

  const channels = await all<{ id: string; name: string; platform: string; url: string; est_audience: number; fit_notes: string; angle: string; status: string }>(
    "SELECT * FROM channels WHERE product_id = ? AND user_id = ? ORDER BY CASE status WHEN 'converting' THEN 0 WHEN 'active' THEN 1 WHEN 'researching' THEN 2 WHEN 'idea' THEN 3 ELSE 4 END, est_audience DESC",
    selected.id, user.id,
  );
  const reach = channels.filter((c) => c.status === "active" || c.status === "converting").reduce((n, c) => n + c.est_audience, 0);

  return (
    <>
      <div className="page-head">
        <div><h1>Audience Finder</h1><p>Find groups of buyers who already exist, then track what you&apos;ve done in each one. You don&apos;t need ads to start.</p></div>
        <ProductPicker products={products} selected={selected.id} basePath="/distribution" />
      </div>
      <Finder productId={selected.id} />
      <div className="grid grid-3 mt">
        <div className="card stat"><div className="stat-label">Channels tracked</div><div className="stat-value">{channels.length}</div></div>
        <div className="card stat"><div className="stat-label">Active / converting</div><div className="stat-value">{channels.filter((c) => c.status === "active" || c.status === "converting").length}</div></div>
        <div className="card stat"><div className="stat-label">Est. reach (active)</div><div className="stat-value">{reach.toLocaleString()}</div></div>
      </div>

      <div className="card mt">
        <h2>Channels</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Channel</th><th>Why buyers are here / angle</th><th className="num">Est. size</th><th>Status</th><th /></tr></thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer nofollow">{c.name}</a> : c.name}</strong><div className="small muted">{c.platform}</div></td>
                  <td className="small">{c.fit_notes}{c.angle && <div className="muted">→ {c.angle}</div>}</td>
                  <td className="num small">{c.est_audience ? `~${c.est_audience.toLocaleString()}` : "?"}</td>
                  <td>
                    <form action={setChannelStatus} className="row" style={{ flexWrap: "nowrap" }}>
                      <input type="hidden" name="id" value={c.id} />
                      <select name="status" defaultValue={c.status} style={{ width: 130 }}>{CHANNEL_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
                      <button className="btn small">Set</button>
                    </form>
                    <span className={`badge ${TONE[c.status]}`} style={{ marginTop: 4 }}>{c.status}</span>
                  </td>
                  <td><form action={deleteChannel}><input type="hidden" name="id" value={c.id} /><button className="btn small danger" aria-label="Delete">×</button></form></td>
                </tr>
              ))}
              {channels.length === 0 && <tr><td colSpan={5} className="muted">No channels yet. Run the finder or add one you know.</td></tr>}
            </tbody>
          </table>
        </div>
        <form action={addChannel} className="grid grid-4 mt" style={{ alignItems: "end" }}>
          <input type="hidden" name="product_id" value={selected.id} />
          <div><label>Name</label><input type="text" name="name" required placeholder="r/somecommunity" /></div>
          <div><label>Platform</label><input type="text" name="platform" placeholder="Reddit" /></div>
          <div><label>URL</label><input type="url" name="url" placeholder="https://" /></div>
          <div className="row" style={{ flexWrap: "nowrap" }}><input type="number" name="est_audience" placeholder="Size" min={0} /><button className="btn">Add</button></div>
        </form>
      </div>
      <p className="small muted mt">Tip: run the <Link href={`/studio?product=${selected.id}`}>Community Value Post</Link> agent to write posts that help first and sell second.</p>
    </>
  );
}
