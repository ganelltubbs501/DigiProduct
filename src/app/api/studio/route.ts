import { currentUser } from "@/lib/auth";
import { all, get, id, now, run } from "@/lib/db";
import { streamText, textResponse } from "@/lib/ai";
import { agentByKey } from "@/lib/agents";
import { money, type Product } from "@/lib/products";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { productId?: string; agent?: string; extra?: string };
  const agent = agentByKey(body.agent ?? "");
  if (!agent) return new Response("Unknown agent", { status: 400 });
  const product = get<Product & { partner_name: string | null; partner_audience: number | null; partner_platform: string | null }>(
    `SELECT p.*, pa.name AS partner_name, pa.audience_size AS partner_audience, pa.platform AS partner_platform
     FROM products p LEFT JOIN partners pa ON pa.id = p.partner_id WHERE p.id = ? AND p.user_id = ?`,
    body.productId ?? "", user.id,
  );
  if (!product) return new Response("Product not found", { status: 404 });
  const sections = all<{ title: string; brief: string }>("SELECT title, brief FROM sections WHERE product_id = ? ORDER BY position", product.id);

  const brief = [
    `Product: ${product.title} (${product.kind})`,
    product.tagline && `Tagline: ${product.tagline}`,
    `Price: ${money(product.price_cents)}`,
    `Buyer: ${product.audience || "(not set)"}`,
    `Problem: ${product.problem || "(not set)"}`,
    `Promised result: ${product.promise || "(not set)"}`,
    product.partner_name && `Creator partner: ${product.partner_name} on ${product.partner_platform || "social media"} with about ${product.partner_audience ?? 0} followers`,
    sections.length > 0 && `Contents:\n${sections.map((s, i) => `${i + 1}. ${s.title}: ${s.brief}`).join("\n")}`,
    product.description && `Current description:\n${product.description}`,
  ]
    .filter(Boolean)
    .join("\n");

  const stream = streamText({
    system: `You are the "${agent.name}" agent in a launch copy studio. Your job: ${agent.instructions}\nOutput clean Markdown only, with no preamble.`,
    effort: "medium",
    messages: [{ role: "user", content: `${brief}\n\n${body.extra ? `Extra instructions from the seller: ${body.extra}` : ""}` }],
    demo: () => `# ${agent.name}: ${product.title}\n\n_Demo output: set ANTHROPIC_API_KEY to generate real copy._\n\n**Task:** ${agent.instructions}\n\n**For:** ${product.audience || "your buyer"}\n\n**Promise:** ${product.promise || product.tagline}\n\n- Point one about the result\n- Point two about the speed\n- Point three about who it's for\n`,
    onDone: (text) => {
      run("INSERT INTO assets (id, user_id, product_id, agent_key, title, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", id(), user.id, product.id, agent.key, agent.name, text.trim(), now());
    },
  });
  return textResponse(stream);
}
