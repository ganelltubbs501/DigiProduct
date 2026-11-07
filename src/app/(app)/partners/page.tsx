import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { PARTNER_STAGES } from "@/lib/constants";
import { createPartner } from "@/app/actions/partners";

export const metadata = { title: "Partner CRM" };

type Row = { id: string; name: string; platform: string; audience_size: number; niche: string; stage: string; split_pct: number; updated_at: string };

export default async function PartnersPage() {
  const user = await requireUser();
  const partners = all<Row>("SELECT id, name, platform, audience_size, niche, stage, split_pct, updated_at FROM partners WHERE user_id = ? ORDER BY updated_at DESC", user.id);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Partner CRM</h1>
          <p>Partner with creators who have an audience but no product. You build and run the product, they promote it, and you split the revenue. Track every partnership from first message to launch.</p>
        </div>
      </div>
      <div className="board">
        {PARTNER_STAGES.map((s) => {
          const items = partners.filter((p) => p.stage === s.key);
          return (
            <div key={s.key} className="column">
              <h3>{s.label} <span className="muted">{items.length}</span></h3>
              {items.map((p) => (
                <Link key={p.id} href={`/partners/${p.id}`} className="deal">
                  <strong>{p.name}</strong>
                  <div className="small muted">{p.platform}{p.audience_size ? ` · ${p.audience_size.toLocaleString()}` : ""}</div>
                  <div className="small muted">{p.niche}</div>
                  <div className="small">{p.split_pct}% to partner</div>
                </Link>
              ))}
            </div>
          );
        })}
      </div>
      <form action={createPartner} className="card mt-lg">
        <h2>Add a creator</h2>
        <p className="small muted">A good prospect has an engaged audience, recurring questions in their comments, and nothing for sale yet.</p>
        <div className="grid grid-3">
          <div className="field"><label>Name</label><input type="text" name="name" required /></div>
          <div className="field"><label>Handle</label><input type="text" name="handle" placeholder="@handle" /></div>
          <div className="field"><label>Platform</label><input type="text" name="platform" placeholder="YouTube, Instagram…" /></div>
          <div className="field"><label>Audience size</label><input type="number" name="audience_size" min={0} /></div>
          <div className="field"><label>Niche</label><input type="text" name="niche" /></div>
          <div className="field"><label>Partner&apos;s split %</label><input type="number" name="split_pct" min={0} max={100} defaultValue={50} /></div>
        </div>
        <div className="field"><label>What their audience keeps asking</label><textarea name="notes" placeholder="Paste recurring questions from their comments" /></div>
        <button className="btn primary">Add to pipeline</button>
      </form>
    </>
  );
}
