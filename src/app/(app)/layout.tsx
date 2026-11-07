import { requireUser } from "@/lib/auth";
import { aiEnabled } from "@/lib/ai";
import { logout } from "@/app/actions/auth";
import { Sidebar } from "@/app/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="shell">
      <Sidebar name={user.name} aiOn={aiEnabled()} logout={logout} />
      <main className="main">
        {!aiEnabled() && (
          <div className="notice">
            Demo mode: no <code>ANTHROPIC_API_KEY</code> is set, so AI tools return sample output. Add a key to <code>.env.local</code> for real results.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
