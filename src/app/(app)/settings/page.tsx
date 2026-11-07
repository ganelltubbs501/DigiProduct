import { requireUser } from "@/lib/auth";
import { aiEnabled, MODEL } from "@/lib/ai";
import { paymentsLive } from "@/lib/payments";
import { saveSettings } from "@/app/actions/settings";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div style={{ maxWidth: 640 }}>
      <h1>Settings</h1>
      <form action={saveSettings} className="card">
        <div className="field"><label>Name</label><input type="text" name="name" defaultValue={user.name} /></div>
        <div className="field"><label>Email</label><input type="email" value={user.email} disabled /></div>
        <div className="field"><label>Skills <span className="hint">(used by Demand Lab and the Coach)</span></label><textarea name="skills" defaultValue={user.skills} /></div>
        <div className="field row"><input id="lb" type="checkbox" name="leaderboard" defaultChecked={user.leaderboard_opt_in === 1} /><label htmlFor="lb" style={{ margin: 0 }}>Show me on the 90-day leaderboard</label></div>
        <button className="btn primary">Save</button>
      </form>
      <div className="card">
        <h2>Integrations</h2>
        <table className="table"><tbody>
          <tr><td>Claude API</td><td><span className={`badge ${aiEnabled() ? "good" : "warn"}`}>{aiEnabled() ? `Connected (${MODEL})` : "Not set: demo mode"}</span></td></tr>
          <tr><td>Stripe payments</td><td><span className={`badge ${paymentsLive() ? "good" : "warn"}`}>{paymentsLive() ? "Live" : "Test mode"}</span></td></tr>
        </tbody></table>
        <p className="small muted mt" style={{ marginBottom: 0 }}>Configure with environment variables: <code>ANTHROPIC_API_KEY</code>, <code>STRIPE_SECRET_KEY</code>, <code>STRIPE_WEBHOOK_SECRET</code>, <code>APP_URL</code>. See the README.</p>
      </div>
    </div>
  );
}
