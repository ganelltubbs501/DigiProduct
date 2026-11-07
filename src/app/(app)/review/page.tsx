import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { all, parseJSON } from "@/lib/db";
import type { LaunchReview } from "@/lib/review";
import { daysSince } from "@/lib/progress";
import { ProductPicker } from "@/app/components/ProductPicker";
import { ReviewButton } from "@/app/components/ReviewButton";

export const metadata = { title: "Launch Review" };

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const user = await requireUser();
  const products = all<{ id: string; title: string; published_at: string | null; orders: number }>(
    "SELECT p.id, p.title, p.published_at, (SELECT COUNT(*) FROM orders o WHERE o.product_id = p.id AND o.status = 'paid') AS orders FROM products p WHERE p.user_id = ? ORDER BY p.created_at DESC",
    user.id,
  );
  const { product } = await searchParams;
  const selected = products.find((p) => p.id === product) ?? products[0];
  if (!selected) return (<><h1>Launch Review</h1><div className="card"><p>Create a product first.</p><Link className="btn primary" href="/products/new">New product</Link></div></>);
  const reviews = all<{ id: string; report_json: string; created_at: string }>("SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC", selected.id);
  const days = daysSince(selected.published_at);
  const flagged = selected.published_at && days >= 60 && selected.orders === 0;

  return (
    <>
      <div className="page-head">
        <div><h1>Launch Review</h1><p>A diagnosis based on your product, listing, price, distribution activity and assets, with a 14-day plan. Run it any time; it&apos;s most useful when a product isn&apos;t selling.</p></div>
        <ProductPicker products={products} selected={selected.id} basePath="/review" />
      </div>
      {flagged && <div className="notice">This product has been live {days} days with no sales. A review is strongly recommended.</div>}
      <div className="card spread">
        <div className="small muted">{selected.published_at ? `Live ${days} days · ${selected.orders} sales` : "Not published yet"}</div>
        <ReviewButton productId={selected.id} />
      </div>
      {reviews.map((r, i) => {
        const rep = parseJSON<LaunchReview | null>(r.report_json, null);
        if (!rep) return null;
        return (
          <details key={r.id} className="card mt" open={i === 0}>
            <summary><strong>Review from {new Date(r.created_at).toLocaleString()}</strong></summary>
            <p className="mt">{rep.overall}</p>
            <div className="grid grid-3">
              {rep.scores.map((s) => (
                <div key={s.area} className="card" style={{ boxShadow: "none", background: "var(--surface-2)" }}>
                  <div className="spread"><strong className="small">{s.area}</strong><span className={`badge ${s.score >= 7 ? "good" : s.score >= 5 ? "warn" : "bad"}`}>{s.score}/10</span></div>
                  <div className="small muted mt">{s.finding}</div>
                </div>
              ))}
            </div>
            <h3 className="mt">Top problems</h3>
            <ul>{rep.top_problems.map((t, j) => <li key={j}>{t}</li>)}</ul>
            <h3>Action plan</h3>
            <table className="table"><tbody>{rep.action_plan.map((a, j) => <tr key={j}><td style={{ whiteSpace: "nowrap" }}><strong>{a.day}</strong></td><td>{a.task}<div className="small muted">{a.why}</div></td></tr>)}</tbody></table>
          </details>
        );
      })}
    </>
  );
}
