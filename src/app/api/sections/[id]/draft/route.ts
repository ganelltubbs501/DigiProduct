// AI streams can run for minutes; raise the serverless timeout (Vercel caps it by plan).
export const maxDuration = 300;

import { currentUser } from "@/lib/auth";
import { get, now, run } from "@/lib/db";
import { streamText, textResponse } from "@/lib/ai";
import { outlineText, productSections, type Product } from "@/lib/products";
import { sectionSystemPrompt } from "@/lib/research";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { notes?: string; title?: string; brief?: string };
  const section = await get<{ id: string; product_id: string; title: string; brief: string; position: number }>(
    "SELECT s.id, s.product_id, s.title, s.brief, s.position FROM sections s JOIN products p ON p.id = s.product_id WHERE s.id = ? AND p.user_id = ?",
    id, user.id,
  );
  if (!section) return new Response("Not found", { status: 404 });
  const product = (await get<Product>("SELECT * FROM products WHERE id = ?", section.product_id))!;
  const title = body.title?.trim() || section.title;
  const brief = body.brief?.trim() ?? section.brief;
  const outline = outlineText(await productSections(product.id));

  const stream = streamText({
    system: sectionSystemPrompt(product, outline),
    effort: "medium",
    messages: [
      {
        role: "user",
        content: `Write section ${section.position}: "${title}".\nWhat it must cover: ${brief || "(use the outline)"}\n${body.notes ? `Author's notes and examples to include: ${body.notes}` : ""}\nTarget length: 1,200-2,000 words.`,
      },
    ],
    demo: () =>
      `## ${title}\n\n_Demo draft: set ANTHROPIC_API_KEY to generate real content._\n\n${brief}\n\n### Why this matters\n\nFor ${product.audience || "your reader"}, this step is where most people stall. Here's a simple way through it.\n\n### Step by step\n\n1. **Define the goal.** Write one sentence describing what "done" looks like.\n2. **Gather what you have.** List the tools, notes and examples you already own.\n3. **Do the smallest version first.** Ship a rough version today, then improve it.\n4. **Review and adjust.** Compare against the goal and fix the biggest gap.\n\n### Checklist\n\n- [ ] Goal written down\n- [ ] Inputs gathered\n- [ ] First version done\n- [ ] One improvement made\n`,
    onDone: async (text) => {
      await run("UPDATE sections SET title = ?, brief = ?, content = ?, updated_at = ? WHERE id = ?", title, brief, text.trim(), now(), section.id);
    },
  });
  return textResponse(stream);
}
