import "server-only";
import { z } from "zod";
import { AIError, generateObject, researchWeb, webResearchEnabled, type Source } from "./ai";
import { SIGNALS, type Signals } from "./scoring";

export const PRODUCT_KINDS = ["ebook", "template", "guide", "course", "toolkit", "workbook"] as const;

const IdeaSchema = z.object({
  title: z.string(),
  kind: z.enum(PRODUCT_KINDS),
  audience: z.string().describe("A specific buyer, e.g. 'first-time Etsy sellers making under $500/month'"),
  problem: z.string(),
  promise: z.string().describe("The concrete result the buyer gets"),
  why_it_sells: z.string(),
  evidence_to_check: z.array(z.string()).describe("Concrete places to verify demand before building"),
  suggested_price_usd: z.number(),
});
export type Idea = z.infer<typeof IdeaSchema>;

const IdeasSchema = z.object({
  value_zone: z.string().describe("One paragraph: where the person's skills overlap with what people pay for"),
  ideas: z.array(IdeaSchema),
});
export type IdeasResult = z.infer<typeof IdeasSchema>;

export async function ideasFromSkills(input: { skills: string; experience: string; interests: string }): Promise<IdeasResult> {
  return generateObject({
    schema: IdeasSchema,
    effort: "medium",
    system: `You generate digital product ideas from a person's real skills and experience. Find their "value zone": what they know that others struggle with and already pay to learn. Return 5 ideas, each narrow enough to finish in two weeks. Prefer narrow audiences over broad ones.`,
    prompt: `Skills: ${input.skills}\nExperience: ${input.experience}\nInterests / communities I'm part of: ${input.interests}`,
    demo: () => demoIdeas(input.skills || "spreadsheets"),
  });
}

export async function ideasFromBrief(input: { audience: string; expertise: string; problem: string; result: string }): Promise<IdeasResult> {
  return generateObject({
    schema: IdeasSchema,
    effort: "medium",
    system: `You plan digital products for a creator partnership: a creator has an audience and expertise; the operator builds and sells the product for a revenue split. Return 5 product concepts this creator's audience would plausibly buy, from a low-priced entry product to a premium one. Use value_zone to summarise what this audience pays for.`,
    prompt: `Audience: ${input.audience}\nCreator's expertise: ${input.expertise}\nProblem the audience has: ${input.problem}\nResult they want: ${input.result}`,
    demo: () => demoIdeas(input.expertise || input.audience || "fitness"),
  });
}

const SignalEstimateSchema = z.object({
  estimates: z.array(
    z.object({
      key: z.enum(["demand", "intent", "pain", "competition", "fit"]),
      value: z.number().describe("0-10"),
      reasoning: z.string(),
    }),
  ),
  evidence_to_check: z.array(z.string()),
  sharper_angle: z.string().describe("A narrower, more sellable version of this topic"),
});
export type SignalEstimate = z.infer<typeof SignalEstimateSchema> & {
  /** Pages the web research step read. Empty when estimated from model knowledge only. */
  sources?: Source[];
  researched?: boolean;
  research_note?: string;
};

export async function estimateSignals(topic: string, context: string): Promise<SignalEstimate> {
  const rubric = SIGNALS.map((s) => `- ${s.key} (${s.label}): ${s.question} Evidence: ${s.evidence}`).join("\n");

  // Step 1: gather current evidence from the web (paid products, prices, reviews, communities, complaints).
  let research: { notes: string; sources: Source[] } | null = null;
  let researchNote = "";
  if (webResearchEnabled()) {
    try {
      research = await researchWeb({
        system: `You research market demand for a digital product topic. Search the web for concrete evidence on each of these signals:\n${rubric}\nLook for: existing paid products (marketplaces like Etsy, Gumroad, Udemy, Amazon Kindle) with prices and review counts; communities and their sizes; recurring questions and complaints; how crowded the market is. Report what you found as concise notes with numbers and the page each fact came from. Say clearly where evidence is thin.`,
        prompt: `Topic: ${topic}\nSeller context: ${context || "(not given)"}`,
      });
    } catch (err) {
      researchNote = `Web research failed (${err instanceof AIError ? err.message : "unknown error"}), so this estimate uses model knowledge only.`;
    }
  }

  const est = await generateObject({
    schema: SignalEstimateSchema,
    effort: "high",
    system: `You estimate demand signals for a digital product topic on a 0-10 scale using this rubric:\n${rubric}\nFor competition, 10 means extremely crowded. ${
      research
        ? "Base every estimate on the research notes provided and mention the specific evidence (numbers, products, communities) in each reasoning. Where the notes have no evidence for a signal, say so and stay conservative."
        : "You have no live data, so be conservative and say what you are unsure of in the reasoning."
    } These are first-pass estimates the user will verify. Return one estimate for each of the five keys.`,
    prompt: `Topic: ${topic}\nAbout me / my partner: ${context || "(not given)"}${research ? `\n\nResearch notes from a web search just now:\n${research.notes}` : ""}`,
    demo: () => demoSignals(topic),
  });
  return { ...est, sources: research?.sources ?? [], researched: Boolean(research), research_note: researchNote || undefined };
}

export function estimatesToSignals(est: SignalEstimate): Signals {
  const out: Signals = { demand: 5, intent: 5, pain: 5, competition: 5, fit: 5 };
  for (const e of est.estimates) out[e.key] = e.value;
  return out;
}

const OutlineSchema = z.object({
  title: z.string(),
  tagline: z.string(),
  description: z.string().describe("2-3 paragraph product description for the store page, plain text"),
  sections: z.array(z.object({ title: z.string(), brief: z.string().describe("What this section covers and the outcome") })),
  bonuses: z.array(z.string()),
  price_usd: z.number(),
  pricing_rationale: z.string(),
});
export type Outline = z.infer<typeof OutlineSchema>;

export async function outlineProduct(p: { title: string; kind: string; audience: string; problem: string; promise: string }): Promise<Outline> {
  return generateObject({
    schema: OutlineSchema,
    effort: "high",
    system: `You design the structure of a digital product. Each section must move the buyer one step closer to the promised result; cut anything that doesn't. For an ebook or guide use 6-10 chapters. For a course use modules. For templates/toolkits, each section is a component with instructions. Include practical elements (checklists, worksheets, examples) in the briefs.`,
    prompt: `Product type: ${p.kind}\nWorking title: ${p.title}\nBuyer: ${p.audience}\nProblem: ${p.problem}\nPromised result: ${p.promise}`,
    demo: () => demoOutline(p),
  });
}

export function sectionSystemPrompt(p: { title: string; kind: string; audience: string; promise: string }, outline: string) {
  return `You are writing one section of a ${p.kind} titled "${p.title}" for ${p.audience}. The product's promise: ${p.promise}.
Full outline for context:
${outline}

Write in Markdown. Use concrete examples, step-by-step instructions, and where useful a short checklist or worksheet at the end. Do not repeat material from other sections. Do not include a preamble or closing remarks about the writing; output only the section content, starting with its heading.`;
}

/* ---------- Demo-mode output (no API key) ---------- */

function demoIdeas(seed: string): IdeasResult {
  const s = seed.split(/[,.\n]/)[0].trim() || "your skill";
  return {
    value_zone: `Demo mode (no ANTHROPIC_API_KEY). Your strongest overlap is where "${s}" saves people time or money they're already spending. Narrow audiences with an urgent deadline buy fastest.`,
    ideas: [
      {
        title: `The 7-Day ${cap(s)} Starter System`,
        kind: "guide",
        audience: `Beginners who need ${s} for work this month`,
        problem: "Free tutorials are scattered and assume too much",
        promise: `Go from zero to a working ${s} setup in one week`,
        why_it_sells: "Deadline-driven buyers pay to skip the trial and error.",
        evidence_to_check: [`Search "${s} for beginners" questions on Reddit`, "Look at top-selling guides on Gumroad/Etsy and their reviews"],
        suggested_price_usd: 29,
      },
      {
        title: `${cap(s)} Templates Pack`,
        kind: "template",
        audience: "Freelancers and small business owners",
        problem: "Rebuilding the same documents from scratch every time",
        promise: "Ready-to-use templates with filled examples",
        why_it_sells: "Templates are a low-risk, instant-value purchase.",
        evidence_to_check: ["Count template listings and review volume on Etsy", "Check Pinterest saves for related templates"],
        suggested_price_usd: 19,
      },
      {
        title: `${cap(s)} Mistakes Checklist`,
        kind: "workbook",
        audience: "People who tried and got stuck",
        problem: "They don't know what they're doing wrong",
        promise: "Diagnose and fix the 20 most common mistakes",
        why_it_sells: "Pain-driven: buyers are already frustrated.",
        evidence_to_check: ["Collect 1-3 star reviews of competing products", "Search forums for 'why doesn't my ... work'"],
        suggested_price_usd: 12,
      },
    ],
  };
}

function demoSignals(topic: string): SignalEstimate {
  const h = [...topic].reduce((a, c) => a + c.charCodeAt(0), 0);
  const v = (o: number) => 4 + ((h + o) % 6);
  return {
    estimates: [
      { key: "demand", value: v(1), reasoning: "Demo estimate. Verify with search volume and community size." },
      { key: "intent", value: v(2), reasoning: "Demo estimate. Look for paid products with reviews." },
      { key: "pain", value: v(3), reasoning: "Demo estimate. Collect complaints from forums and reviews." },
      { key: "competition", value: v(4), reasoning: "Demo estimate. Count near-identical listings." },
      { key: "fit", value: v(5), reasoning: "Demo estimate. Based on the context you gave." },
    ],
    evidence_to_check: [`Reddit/forum threads asking about "${topic}"`, `Top 10 paid products for "${topic}" and their review counts`],
    sharper_angle: `${topic} for one specific job title, with a 7-day deadline`,
  };
}

function demoOutline(p: { title: string; kind: string; audience: string; problem: string; promise: string }): Outline {
  return {
    title: p.title,
    tagline: p.promise || "A practical, step-by-step system",
    description: `Demo outline (no ANTHROPIC_API_KEY set).\n\nBuilt for ${p.audience || "your buyer"}, this ${p.kind} tackles ${p.problem || "one painful problem"} with a clear sequence of steps, worked examples and checklists.\n\nBy the end you will ${p.promise || "have the result you came for"}.`,
    sections: [
      { title: "Start Here: The Result and the Path", brief: "Define the end result and show the whole roadmap on one page." },
      { title: "Diagnose Where You Are", brief: "A self-assessment worksheet that places the reader on the roadmap." },
      { title: "The Core Method, Step by Step", brief: "The main process with a worked example." },
      { title: "Common Mistakes and Fixes", brief: "The top mistakes, how to spot them, how to fix them." },
      { title: "Tools and Templates", brief: "Copy-paste templates and recommended tools." },
      { title: "Your 7-Day Action Plan", brief: "A day-by-day plan with a checklist." },
    ],
    bonuses: ["Printable checklist", "Swipe file of examples"],
    price_usd: 27,
    pricing_rationale: "Entry-level price for a focused guide; raise it once you have reviews.",
  };
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
