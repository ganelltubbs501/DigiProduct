import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { clearCoach } from "@/app/actions/coach";
import { CoachChat } from "@/app/components/CoachChat";

export const metadata = { title: "Coach" };

export default async function CoachPage() {
  const user = await requireUser();
  const messages = all<{ role: "user" | "assistant"; content: string }>("SELECT role, content FROM coach_messages WHERE user_id = ? ORDER BY created_at ASC LIMIT 200", user.id);
  return (
    <div style={{ maxWidth: 820 }}>
      <div className="page-head">
        <div><h1>Coach</h1><p>Available any time. It knows your products, progress and sales.</p></div>
        {messages.length > 0 && <form action={clearCoach}><button className="btn small">Clear conversation</button></form>}
      </div>
      <CoachChat key={messages.length} initial={messages} />
    </div>
  );
}
