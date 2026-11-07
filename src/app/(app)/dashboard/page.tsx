import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { checklist, daysSince, journey, nextStep } from "@/lib/progress";
import { money } from "@/lib/products";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const user = await requireUser();
  const j = journey(user.id);
  const steps = checklist(j);
  const next = nextStep(j);
  const done = steps.filter((s) => s.done).length;
  const challengeDay = Math.min(90, daysSince(user.challenge_started_at) + 1);
  const recent = all<{ title: string; buyer_email: string; amount_cents: number; created_at: string; test_mode: number }>(
    `SELECT p.title, o.buyer_email, o.amount_cents, o.created_at, o.test_mode FROM orders o JOIN products p ON p.id = o.product_id
     WHERE p.user_id = ? AND o.status = 'paid' ORDER BY o.created_at DESC LIMIT 5`,
    user.id,
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Welcome back, {user.name.split(" ")[0]}</h1>
          <p>Day {challengeDay} of your 90-day challenge.</p>
        </div>
        {next && <Link href={next.href} className="btn primary">Next: {next.label}</Link>}
      </div>

      <div className="grid grid-4">
        <div className="card stat"><div className="stat-label">Revenue</div><div className="stat-value">{money(j.revenueCents)}</div></div>
        <div className="card stat"><div className="stat-label">Sales</div><div className="stat-value">{j.orders}</div></div>
        <div className="card stat"><div className="stat-label">Products live</div><div className="stat-value">{j.published}<span className="muted small"> / {j.products}</span></div></div>
        <div className="card stat"><div className="stat-label">Words drafted</div><div className="stat-value">{j.words.toLocaleString()}</div></div>
      </div>

      <div className="grid grid-2 mt">
        <div className="card">
          <div className="spread"><h2 style={{ margin: 0 }}>Launch checklist</h2><span className="muted small">{done}/{steps.length}</span></div>
          <div className="bar mt"><span style={{ width: `${(done / steps.length) * 100}%` }} /></div>
          <div className="lesson-list mt">
            {steps.map((s) => (
              <Link key={s.label} href={s.href}>
                <span className="row"><span className={`check${s.done ? " done" : ""}`} /> {s.label}</span>
                <span className="muted small">{s.done ? "Done" : "Open"}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="stack">
          <div className="card">
            <h2>Pipeline</h2>
            <div className="grid grid-2">
              <div><div className="stat-label">Topics scored</div><div className="stat-value">{j.topics}</div></div>
              <div><div className="stat-label">Launch assets</div><div className="stat-value">{j.assets}</div></div>
              <div><div className="stat-label">Channels (active)</div><div className="stat-value">{j.channels} <span className="muted small">({j.channelsActive})</span></div></div>
              <div><div className="stat-label">Partners (signed)</div><div className="stat-value">{j.partners} <span className="muted small">({j.partnersSigned})</span></div></div>
            </div>
          </div>
          <div className="card">
            <div className="spread"><h2 style={{ margin: 0 }}>Academy</h2><Link href="/academy" className="small">Continue</Link></div>
            <div className="bar mt"><span style={{ width: `${(j.lessonsDone / j.lessonsTotal) * 100}%` }} /></div>
            <p className="small muted mt" style={{ marginBottom: 0 }}>{j.lessonsDone} of {j.lessonsTotal} lessons complete</p>
          </div>
        </div>
      </div>

      <div className="card mt">
        <div className="spread"><h2 style={{ margin: 0 }}>Recent sales</h2><Link href="/sales" className="small">All sales</Link></div>
        {recent.length === 0 ? (
          <p className="muted mt" style={{ marginBottom: 0 }}>No sales yet. {j.published === 0 ? "Publish a product to open your store." : "Share your store link where your buyers gather."}</p>
        ) : (
          <div className="table-wrap mt">
            <table className="table">
              <tbody>
                {recent.map((r, i) => (
                  <tr key={i}>
                    <td>{r.title}</td>
                    <td className="muted">{r.buyer_email}{r.test_mode ? " (test)" : ""}</td>
                    <td className="num">{money(r.amount_cents)}</td>
                    <td className="muted small num">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
