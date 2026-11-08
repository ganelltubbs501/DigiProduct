// AI streams can run for minutes; raise the serverless timeout (Vercel caps it by plan).
export const maxDuration = 300;

import { currentUser } from "@/lib/auth";
import { all, id, now, run } from "@/lib/db";
import { streamText, textResponse, type ChatTurn } from "@/lib/ai";
import { journey, nextStep } from "@/lib/progress";
import { money } from "@/lib/products";
import { CURRICULUM } from "@/lib/curriculum";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { message } = (await req.json().catch(() => ({}))) as { message?: string };
  const text = (message ?? "").trim().slice(0, 8000);
  if (!text) return new Response("Empty message", { status: 400 });

  await run("INSERT INTO coach_messages (id, user_id, role, content, created_at) VALUES (?, ?, 'user', ?, ?)", id(), user.id, text, now());
  const history = (await all<ChatTurn>("SELECT role, content FROM coach_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 20", user.id)).reverse();

  const j = await journey(user.id);
  const products = await all<{ title: string; status: string; price_cents: number; audience: string }>("SELECT title, status, price_cents, audience FROM products WHERE user_id = ?", user.id);
  const next = nextStep(j);
  const tools = "Demand Lab (/research), Products (/products), Launch Studio (/studio), Audience Finder (/distribution), Partner CRM (/partners), Sales (/sales), Launch Review (/review), Academy (/academy)";

  const system = `You are the DigiProduct coach: a practical, honest mentor for someone building and selling digital products. Answer their question directly, then point to the specific tool in the platform that helps (${tools}). Keep answers short unless they ask for depth. Never promise income.

Curriculum stages: ${CURRICULUM.map((s) => `${s.title} (${s.lessons.map((l) => l.title).join(", ")})`).join("; ")}.

What you know about this user (live data):
- Name: ${user.name}. Skills: ${user.skills || "not given"}
- Products: ${products.length ? products.map((p) => `"${p.title}" (${p.status}, ${money(p.price_cents)}, for ${p.audience || "unspecified buyer"})`).join("; ") : "none yet"}
- Words drafted: ${j.words}. Launch assets: ${j.assets}. Distribution channels: ${j.channels} (${j.channelsActive} active). Partners: ${j.partners} (${j.partnersSigned} signed).
- Sales: ${j.orders}, revenue ${money(j.revenueCents)}. Academy: ${j.lessonsDone}/${j.lessonsTotal} lessons.
- Suggested next step: ${next ? next.label : "keep iterating and build the next product"}.`;

  const stream = streamText({
    system,
    effort: "low",
    maxTokens: 16000,
    messages: history,
    demo: () => `Demo mode: set ANTHROPIC_API_KEY for real coaching.\n\nBased on your progress, your next step is **${next?.label ?? "building your next product"}**. Open ${next?.href ?? "/research"} to do it. You asked: "${text.slice(0, 140)}". In general, start from demand: find where buyers already complain, pick a narrow promise, and ship a small version fast.`,
    onDone: async (reply) => {
      await run("INSERT INTO coach_messages (id, user_id, role, content, created_at) VALUES (?, ?, 'assistant', ?, ?)", id(), user.id, reply.trim(), now());
    },
  });
  return textResponse(stream);
}
