import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { money } from "@/lib/products";
import { paymentsLive } from "@/lib/payments";
import { daysSince } from "@/lib/progress";

export const metadata = { title: "90-Day Challenge" };

export default async function Leaderboard() {
  const user = await requireUser();
  const includeTest = paymentsLive() ? 0 : 1;
  // Revenue counts only orders inside each member's own 90-day window.
  const rows = all<{ id: string; name: string; revenue: number; sales: number; started: string }>(
    `SELECT u.id, u.name, u.challenge_started_at AS started,
       COALESCE(SUM(o.amount_cents), 0) AS revenue, COUNT(o.id) AS sales
     FROM users u
     LEFT JOIN products p ON p.user_id = u.id
     LEFT JOIN orders o ON o.product_id = p.id AND o.status = 'paid' AND (o.test_mode = 0 OR ? = 1)
       AND o.created_at >= u.challenge_started_at
       AND julianday(o.created_at) - julianday(u.challenge_started_at) <= 90
     WHERE u.leaderboard_opt_in = 1 OR u.id = ?
     GROUP BY u.id ORDER BY revenue DESC, sales DESC, u.created_at ASC LIMIT 100`,
    includeTest, user.id,
  );
  const day = Math.min(90, daysSince(user.challenge_started_at) + 1);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>90-Day Challenge</h1>
          <p>Everyone starts at zero the day they join. Ranked by revenue in your first 90 days. You&apos;re on day {day}.</p>
        </div>
      </div>
      <div className="notice info">
        The leaderboard is for momentum, not a promise of earnings. Most first products earn little, and that&apos;s normal. {user.leaderboard_opt_in ? "You can hide yourself in Settings." : "You're hidden from others; only you see your row."}
        {includeTest ? " Stripe isn't connected, so test-mode orders count here." : " Test-mode orders don't count."}
      </div>
      <div className="card table-wrap">
        <table className="table">
          <thead><tr><th>#</th><th>Member</th><th>Day</th><th className="num">Sales</th><th className="num">Revenue</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={r.id === user.id ? { background: "var(--accent-soft)" } : undefined}>
                <td>{i + 1}</td>
                <td>{r.name}{r.id === user.id ? " (you)" : ""}</td>
                <td className="small muted">{Math.min(90, daysSince(r.started) + 1)}</td>
                <td className="num">{r.sales}</td>
                <td className="num">{money(r.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
