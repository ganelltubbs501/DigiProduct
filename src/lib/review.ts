import "server-only";
import { z } from "zod";
import { generateObject } from "./ai";

const ReviewSchema = z.object({
  overall: z.string().describe("Two-sentence diagnosis"),
  scores: z.array(z.object({ area: z.string(), score: z.number().describe("1-10"), finding: z.string() })),
  top_problems: z.array(z.string()),
  action_plan: z.array(z.object({ day: z.string(), task: z.string(), why: z.string() })),
});
export type LaunchReview = z.infer<typeof ReviewSchema>;

export type ReviewInput = {
  title: string;
  kind: string;
  audience: string;
  problem: string;
  promise: string;
  price: number;
  tagline: string;
  description: string;
  sectionTitles: string[];
  wordCount: number;
  daysLive: number;
  orders: number;
  channels: { name: string; status: string }[];
  assets: string[];
};

export async function reviewLaunch(input: ReviewInput): Promise<LaunchReview> {
  return generateObject({
    schema: ReviewSchema,
    effort: "high",
    system: `You are a launch reviewer. A seller's digital product is not selling (or not selling enough). Diagnose why using the facts given, scoring these areas 1-10: Market & demand, Offer & price, Product completeness, Sales page, Distribution effort, Launch assets. Be direct. Then give a 14-day action plan, most impactful first. Base everything on the data; if distribution effort is near zero, say that's the likely cause before blaming the product.`,
    prompt: JSON.stringify(input, null, 2),
    demo: () => ({
      overall: `Demo review. With ${input.orders} orders after ${input.daysLive} days and ${input.channels.length} distribution channels tracked, the biggest gap is getting the product in front of buyers.`,
      scores: [
        { area: "Market & demand", score: 6, finding: "Plausible demand; verify with 10 buyer conversations." },
        { area: "Offer & price", score: 6, finding: `$${input.price} is reasonable; add one bonus that removes a key obstacle.` },
        { area: "Product completeness", score: input.wordCount > 3000 ? 7 : 4, finding: `${input.wordCount} words drafted across ${input.sectionTitles.length} sections.` },
        { area: "Sales page", score: input.description.length > 300 ? 6 : 3, finding: "Lead with the outcome and who it's for." },
        { area: "Distribution effort", score: Math.min(10, input.channels.length * 2), finding: `${input.channels.length} channels tracked.` },
        { area: "Launch assets", score: Math.min(10, input.assets.length * 2), finding: `${input.assets.length} launch assets created.` },
      ],
      top_problems: ["Not enough people have seen the offer", "Sales page doesn't state the result clearly"],
      action_plan: [
        { day: "Day 1", task: "Rewrite the headline around the single result", why: "Clarity converts." },
        { day: "Day 2-4", task: "Post one genuinely helpful answer per day in your top 3 channels", why: "Visibility first." },
        { day: "Day 5", task: "Pitch 5 creators using the Partnership Pitch agent", why: "Borrowed audiences are the fastest path." },
        { day: "Day 7", task: "Run a 48-hour launch discount to your list", why: "Creates a reason to act now." },
      ],
    }),
  });
}
