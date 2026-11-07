import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { money } from "@/lib/products";
import { paymentsLive } from "@/lib/payments";

export const metadata = { title: "Sales" };

export default async function SalesPage() {
  const user = await requireUser();
  const orders = all<{ id: string; title: string; buyer_email: string; amount_cents: number; status: string; created_at: string; test_mode: number; partner: string | null; split_pct: number | null }>(
    `SELECT o.id, p.title, o.buyer_email, o.amount_cents, o.status, o.created_at, o.test_mode, pa.name AS partner, pa.split_pct
     FROM orders o JOIN products p ON p.id = o.product_id LEFT JOIN partners pa ON pa.id = p.partner_id
     WHERE p.user_id = ? ORDER BY o.created_at DESC LIMIT 500`,
    user.id,
  );
  const paid = orders.filter((o) => o.status === "paid");
  const gross = paid.reduce((n, o) => n + o.amount_cents, 0);
  const partnerShare = paid.reduce((n, o) => n + Math.round((o.amount_cents * (o.split_pct ?? 0)) / 100), 0);
  const live = paid.filter((o) => !o.test_mode).reduce((n, o) => n + o.amount_cents, 0);

  return (
    <>
      <div className="page-head"><div><h1>Sales</h1><p>Every order across your store, with partner splits worked out.</p></div></div>
      {!paymentsLive() && <div className="notice info">Stripe isn&apos;t connected, so the store is in test mode. Set <code>STRIPE_SECRET_KEY</code> to take real payments.</div>}
      <div className="grid grid-4">
        <div className="card stat"><div className="stat-label">Gross (incl. test)</div><div className="stat-value">{money(gross)}</div></div>
        <div className="card stat"><div className="stat-label">Real payments</div><div className="stat-value">{money(live)}</div></div>
        <div className="card stat"><div className="stat-label">Owed to partners</div><div className="stat-value">{money(partnerShare)}</div></div>
        <div className="card stat"><div className="stat-label">Your share</div><div className="stat-value">{money(gross - partnerShare)}</div></div>
      </div>
      <div className="card mt table-wrap">
        <table className="table">
          <thead><tr><th>Date</th><th>Product</th><th>Buyer</th><th>Partner</th><th>Status</th><th className="num">Amount</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="small">{new Date(o.created_at).toLocaleString()}</td>
                <td>{o.title}</td>
                <td className="small">{o.buyer_email}</td>
                <td className="small">{o.partner ? `${o.partner} (${o.split_pct}%)` : "—"}</td>
                <td><span className={`badge ${o.status === "paid" ? "good" : "warn"}`}>{o.status}{o.test_mode ? " · test" : ""}</span></td>
                <td className="num">{money(o.amount_cents)}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={6} className="muted">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
