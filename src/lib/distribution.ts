import "server-only";
import { z } from "zod";
import { AIError, generateObject, researchWeb, webResearchEnabled, type Source } from "./ai";

const ChannelSchema = z.object({
  name: z.string().describe("Specific community, e.g. 'r/Etsy' or 'Notion Creators Discord'"),
  platform: z.string(),
  url: z.string().describe("Best-guess URL, or empty string if unknown"),
  est_audience: z.number().describe("Rough member/follower count; 0 if unknown"),
  why_buyers_are_here: z.string(),
  angle: z.string().describe("How to show up with value there, respecting the rules"),
});

const FinderSchema = z.object({
  search_queries: z.array(z.string()).describe("Queries the user should run to find more of these groups"),
  channels: z.array(ChannelSchema),
  creator_types: z.array(z.string()).describe("Kinds of creators whose audience matches, for partnerships"),
  warnings: z.array(z.string()),
});
export type FinderResult = z.infer<typeof FinderSchema> & { sources?: Source[]; researched?: boolean };

export async function findAudiences(p: { title: string; audience: string; problem: string; promise: string }): Promise<FinderResult> {
  const brief = `Product: ${p.title}\nBuyer: ${p.audience}\nProblem: ${p.problem}\nPromise: ${p.promise}`;
  let research: { notes: string; sources: Source[] } | null = null;
  const warnings: string[] = [];
  if (webResearchEnabled()) {
    try {
      research = await researchWeb({
        system: `You find where buyers for a digital product already gather online. Search the web for specific, currently active communities: subreddits, forums, Facebook groups, Discord servers, newsletters, YouTube channels, podcasts, hashtags and marketplaces. For each, note its exact name, URL, approximate size (members/subscribers) as shown on the page, how active it looks, and whether it allows self-promotion. Also note creators in the niche with an audience but no product of their own.`,
        prompt: brief,
        maxSearches: 8,
      });
    } catch (err) {
      warnings.push(`Web research failed (${err instanceof AIError ? err.message : "unknown error"}); these suggestions come from model knowledge only.`);
    }
  }
  const result = await generateObject({
    schema: FinderSchema,
    effort: "high",
    system: `You find where buyers for a digital product already gather online: subreddits, forums, Facebook groups, Discord servers, newsletters, YouTube channels, hashtags, marketplaces. Return 10-15 specific channels. ${
      research
        ? "Use the research notes: prefer channels the research actually found, use the URLs and sizes it reported, and set url to \"\" and est_audience to 0 when the notes don't give them. Don't invent communities."
        : "You have no live data, so member counts are rough estimates from your knowledge; set url to \"\" when unsure."
    } Emphasise free, rules-respecting ways to contribute value. Warn about communities that ban self-promotion.`,
    prompt: `${brief}${research ? `\n\nResearch notes from a web search just now:\n${research.notes}` : ""}`,
    demo: () => ({
      search_queries: [`"${p.audience}" subreddit`, `${p.problem} facebook group`, `${p.title} discord`, `site:reddit.com "${p.problem}"`],
      channels: [
        { name: "Relevant subreddit (demo)", platform: "Reddit", url: "", est_audience: 50000, why_buyers_are_here: "People post this exact problem weekly.", angle: "Answer questions in depth; link only where rules allow." },
        { name: "Niche Facebook group (demo)", platform: "Facebook", url: "", est_audience: 20000, why_buyers_are_here: "Members share tools and pay for shortcuts.", angle: "Share a free checklist from the product." },
        { name: "Topic newsletter (demo)", platform: "Newsletter", url: "", est_audience: 10000, why_buyers_are_here: "Readers already buy recommended resources.", angle: "Pitch a guest issue or sponsored slot." },
      ],
      creator_types: ["Mid-size YouTubers teaching this topic", "Newsletter writers in the niche"],
      warnings: ["Demo mode: set ANTHROPIC_API_KEY for real suggestions.", "Always read community rules before posting."],
    }),
  });
  return { ...result, warnings: [...warnings, ...result.warnings], sources: research?.sources ?? [], researched: Boolean(research) };
}
