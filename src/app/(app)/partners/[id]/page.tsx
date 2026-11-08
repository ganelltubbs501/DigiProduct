import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { PARTNER_STAGES } from "@/lib/constants";
import { money } from "@/lib/products";
import { deletePartner, logActivity, setStage, updatePartner } from "@/app/actions/partners";
import { ConfirmButton } from "@/app/components/ConfirmButton";

type Partner = { id: string; name: string; handle: string; platform: string; audience_size: number; niche: string; email: string; stage: string; split_pct: number; notes: string };

export default async function PartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const p = await get<Partner>("SELECT * FROM partners WHERE id = ? AND user_id = ?", id, user.id);
  if (!p) notFound();
  const activity = await all<{ id: string; kind: string; note: string; created_at: string }>("SELECT * FROM partner_activities WHERE partner_id = ? ORDER BY created_at DESC", p.id);
  const products = await all<{ id: string; title: string; status: string; revenue: number; sales: number }>(
    `SELECT pr.id, pr.title, pr.status,
       (SELECT COALESCE(SUM(amount_cents),0) FROM orders o WHERE o.product_id = pr.id AND o.status = 'paid') AS revenue,
       (SELECT COUNT(*) FROM orders o WHERE o.product_id = pr.id AND o.status = 'paid') AS sales
     FROM products pr WHERE pr.partner_id = ? AND pr.user_id = ?`,
    p.id, user.id,
  );
  const revenue = products.reduce((n, x) => n + x.revenue, 0);
  const owed = Math.round((revenue * p.split_pct) / 100);
  const brief = new URLSearchParams({ topic: `${p.niche} product for ${p.name}'s audience` }).toString();

  return (
    <>
      <p className="small"><Link href="/partners">Partner CRM</Link></p>
      <div className="page-head">
        <div><h1>{p.name}</h1><p>{[p.handle, p.platform, p.audience_size ? `${p.audience_size.toLocaleString()} followers` : "", p.niche].filter(Boolean).join(" · ")}</p></div>
        <form action={setStage} className="row">
          <input type="hidden" name="id" value={p.id} />
          <select name="stage" defaultValue={p.stage} style={{ width: 160 }}>{PARTNER_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
          <button className="btn">Move</button>
        </form>
      </div>

      <div className="grid grid-3">
        <div className="card stat"><div className="stat-label">Revenue from their products</div><div className="stat-value">{money(revenue)}</div></div>
        <div className="card stat"><div className="stat-label">Owed to partner ({p.split_pct}%)</div><div className="stat-value">{money(owed)}</div></div>
        <div className="card stat"><div className="stat-label">Your share</div><div className="stat-value">{money(revenue - owed)}</div></div>
      </div>

      <div className="grid grid-2 mt" style={{ alignItems: "start" }}>
        <div className="stack">
          <div className="card">
            <h2>Next moves</h2>
            <div className="row">
              <Link className="btn" href={`/research?${brief}#score`}>Score a product idea</Link>
              <Link className="btn" href="/research">Ideas from creator brief</Link>
              {products[0] && <Link className="btn" href={`/studio?product=${products[0].id}`}>Write the pitch (Studio)</Link>}
              <Link className="btn primary" href={`/products/new`}>New product for {p.name.split(" ")[0]}</Link>
            </div>
          </div>
          <div className="card">
            <h2>Products</h2>
            {products.length === 0 ? <p className="muted small">No products linked yet. Pick this partner in a product&apos;s store listing settings.</p> : (
              <table className="table"><tbody>{products.map((x) => (
                <tr key={x.id}><td><Link href={`/products/${x.id}`}>{x.title}</Link></td><td><span className={`badge ${x.status === "published" ? "good" : ""}`}>{x.status}</span></td><td className="num">{x.sales} sales</td><td className="num">{money(x.revenue)}</td></tr>
              ))}</tbody></table>
            )}
          </div>
          <div className="card">
            <h2>Activity</h2>
            <form action={logActivity} className="row">
              <input type="hidden" name="id" value={p.id} />
              <select name="kind" style={{ width: 110 }}><option>note</option><option>message</option><option>email</option><option>call</option></select>
              <input type="text" name="note" placeholder="What happened?" required style={{ flex: 1, minWidth: 160 }} />
              <button className="btn">Log</button>
            </form>
            <ul className="small mt" style={{ paddingLeft: "1.1em" }}>
              {activity.map((a) => <li key={a.id}><span className="badge">{a.kind}</span> {a.note} <span className="muted">· {new Date(a.created_at).toLocaleDateString()}</span></li>)}
            </ul>
          </div>
        </div>
        <form action={updatePartner} className="card">
          <input type="hidden" name="id" value={p.id} />
          <h2>Details</h2>
          <div className="grid grid-2">
            <div className="field"><label>Name</label><input type="text" name="name" defaultValue={p.name} /></div>
            <div className="field"><label>Handle</label><input type="text" name="handle" defaultValue={p.handle} /></div>
            <div className="field"><label>Platform</label><input type="text" name="platform" defaultValue={p.platform} /></div>
            <div className="field"><label>Audience size</label><input type="number" name="audience_size" defaultValue={p.audience_size} /></div>
            <div className="field"><label>Niche</label><input type="text" name="niche" defaultValue={p.niche} /></div>
            <div className="field"><label>Email</label><input type="email" name="email" defaultValue={p.email} /></div>
            <div className="field"><label>Partner&apos;s split %</label><input type="number" name="split_pct" min={0} max={100} defaultValue={p.split_pct} /></div>
          </div>
          <div className="field"><label>Notes and audience questions</label><textarea name="notes" defaultValue={p.notes} style={{ minHeight: 160 }} /></div>
          <div className="spread">
            <button className="btn primary">Save</button>
            <ConfirmButton message={`Remove ${p.name} from your pipeline?`} formAction={deletePartner}>Delete</ConfirmButton>
          </div>
        </form>
      </div>
    </>
  );
}
