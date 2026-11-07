/**
 * Launch Studio agent catalog. Each agent is a specialised writer with its
 * own instructions; all of them receive the same product brief.
 */

export type AgentCategory = "Positioning" | "Sales page" | "Email" | "Ads" | "Social" | "Outreach" | "Support";

export type Agent = {
  key: string;
  name: string;
  category: AgentCategory;
  description: string;
  instructions: string;
};

export const AGENTS: Agent[] = [
  // Positioning
  {
    key: "positioning",
    name: "Positioning Statement",
    category: "Positioning",
    description: "Who it's for, what it replaces, why it's different.",
    instructions:
      "Write a positioning statement in the form: For [buyer] who [situation], [product] is the [category] that [key benefit]. Unlike [alternative], it [differentiator]. Then give 3 alternative versions with different angles and say which is strongest and why.",
  },
  {
    key: "headlines",
    name: "Headline Lab",
    category: "Positioning",
    description: "20 headlines across 5 proven angles.",
    instructions:
      "Write 20 headlines grouped under 5 angles: outcome, speed, pain, mistake-avoidance, identity. Mark your top 3 with a star and explain the pick in one line each.",
  },
  {
    key: "objections",
    name: "Objection Crusher",
    category: "Positioning",
    description: "The real reasons people won't buy, and answers.",
    instructions:
      "List the 10 most likely objections this buyer has (price, time, trust, 'I can find it free', 'will it work for me', etc). For each, write a short honest answer that could go on the sales page. Don't use fake proof.",
  },
  {
    key: "offer-stack",
    name: "Offer Builder",
    category: "Positioning",
    description: "Bundle, bonuses and price anchoring that stay honest.",
    instructions:
      "Design the offer: core product, 2-4 bonuses that remove specific obstacles, a guarantee the seller can actually honor, and a pricing recommendation with 2 tiers. Avoid inflated 'total value' numbers.",
  },
  // Sales page
  {
    key: "sales-page",
    name: "Sales Page",
    category: "Sales page",
    description: "A full long-form sales page in Markdown.",
    instructions:
      "Write a complete sales page in Markdown: headline, subheadline, the problem, why existing options fail, the solution, what's inside (section by section), who it's for / not for, bonuses, guarantee, FAQ, and a clear call to action. Leave clearly marked [PLACEHOLDER] slots for real testimonials instead of inventing them.",
  },
  {
    key: "short-page",
    name: "Short Product Listing",
    category: "Sales page",
    description: "A tight 150-word listing for marketplaces.",
    instructions: "Write a 120-180 word marketplace listing plus 5 bullet benefits and 10 search tags.",
  },
  {
    key: "faq",
    name: "FAQ Writer",
    category: "Sales page",
    description: "12 FAQs that answer pre-purchase doubts.",
    instructions: "Write 12 FAQs with concise answers covering format, access, who it's for, refunds, time needed, and results expectations. Answers must not promise income or outcomes.",
  },
  {
    key: "guarantee",
    name: "Guarantee Copy",
    category: "Sales page",
    description: "A clear, honorable risk reversal.",
    instructions: "Write 3 versions of a guarantee section (simple refund, conditional action-based, and hybrid). Note the operational cost of each for the seller.",
  },
  // Email
  {
    key: "launch-sequence",
    name: "Launch Email Sequence",
    category: "Email",
    description: "7 emails: tease, open, proof, objections, close.",
    instructions:
      "Write a 7-email launch sequence: 2 pre-launch (story, problem), launch day, value/teaching email, objections email, last-chance 24h, and closing email. Each with subject line, preview text and body. Keep each under 300 words.",
  },
  {
    key: "welcome",
    name: "Buyer Welcome Email",
    category: "Email",
    description: "Delivery email that gets buyers to actually start.",
    instructions: "Write the post-purchase welcome email: thank-you, how to access, the very first step to take today, and how to get help. Plus a day-3 check-in email.",
  },
  {
    key: "newsletter",
    name: "Value Newsletter",
    category: "Email",
    description: "A teaching email that soft-sells the product.",
    instructions: "Write a newsletter issue that teaches one useful idea from the product, then a short soft pitch at the end. 400-600 words.",
  },
  // Ads
  {
    key: "meta-ads",
    name: "Meta Ad Variations",
    category: "Ads",
    description: "6 primary texts + headlines for Facebook/Instagram.",
    instructions: "Write 6 Meta ad variations (primary text, headline, description) across angles: pain, outcome, curiosity, social, contrarian, demo. Also suggest the creative for each in one line.",
  },
  {
    key: "search-ads",
    name: "Search Ads",
    category: "Ads",
    description: "Google/Bing headlines, descriptions and keywords.",
    instructions: "Write 15 search ad headlines (max 30 chars), 4 descriptions (max 90 chars), and 20 keywords split into exact/phrase match with likely intent.",
  },
  {
    key: "ugc-script",
    name: "Short Video Script",
    category: "Ads",
    description: "3 hook-first 30-second scripts.",
    instructions: "Write 3 scripts for 30-second vertical videos. Each: a 2-second hook, the problem, the reveal, a call to action. Include on-screen text cues. Faceless-friendly (voiceover + screen recording).",
  },
  // Social
  {
    key: "threads",
    name: "Thread / Carousel Writer",
    category: "Social",
    description: "Educational threads that lead to the product.",
    instructions: "Write 2 educational threads (8-10 posts each) or carousels drawn from the product's content, ending with a soft call to action.",
  },
  {
    key: "content-calendar",
    name: "30-Day Content Calendar",
    category: "Social",
    description: "A month of posts mapped to the launch.",
    instructions: "Create a 30-day content calendar as a Markdown table: day, platform, format, hook, purpose (awareness/trust/sell). Build toward a launch on day 21.",
  },
  {
    key: "community-post",
    name: "Community Value Post",
    category: "Social",
    description: "A helpful post for forums/Reddit/Discord that respects the rules.",
    instructions: "Write 3 genuinely helpful community posts that teach something from the product without a hard pitch. Note where a link would be appropriate only if the community rules allow it.",
  },
  // Outreach
  {
    key: "creator-pitch",
    name: "Creator Partnership Pitch",
    category: "Outreach",
    description: "DM + email to propose a revenue-split product.",
    instructions:
      "Write a short DM and a longer email pitching a creator on a revenue-split partnership: you build and run the product, they promote it. Reference their audience specifically, propose the product concept, the split, and a low-commitment next step.",
  },
  {
    key: "follow-up",
    name: "Follow-up Sequence",
    category: "Outreach",
    description: "3 polite follow-ups that don't nag.",
    instructions: "Write 3 follow-up messages for an unanswered partnership pitch, spaced 3, 7 and 14 days, each adding new value.",
  },
  {
    key: "affiliate-kit",
    name: "Affiliate Kit",
    category: "Outreach",
    description: "Swipe copy for partners promoting the product.",
    instructions: "Write an affiliate swipe kit: 3 emails, 5 social posts, and a one-paragraph product summary partners can paste.",
  },
  // Support
  {
    key: "support-macros",
    name: "Support Replies",
    category: "Support",
    description: "Canned replies for common buyer questions.",
    instructions: "Write 10 support macros: can't access, refund request, wrong format, 'is this for me', discount request, upgrade, lost download link, technical issue, praise reply, complaint reply.",
  },
  {
    key: "review-request",
    name: "Review Request",
    category: "Support",
    description: "Ask buyers for honest reviews.",
    instructions: "Write a review request email and SMS that ask for an honest review (not just positive), plus 3 questions that help buyers write a useful one.",
  },
];

export function agentByKey(key: string): Agent | undefined {
  return AGENTS.find((a) => a.key === key);
}

export const AGENT_CATEGORIES: AgentCategory[] = ["Positioning", "Sales page", "Email", "Ads", "Social", "Outreach", "Support"];
