/**
 * The Academy: a four-stage build-and-launch curriculum. Each lesson ends with
 * an action that links straight into the matching tool, so learning and doing
 * happen in the same place.
 */

export type Lesson = {
  id: string;
  title: string;
  minutes: number;
  body: string;
  action: { label: string; href: string };
};

export type Stage = {
  key: "research" | "build" | "launch" | "grow";
  title: string;
  summary: string;
  lessons: Lesson[];
};

export const CURRICULUM: Stage[] = [
  {
    key: "research",
    title: "1. Research",
    summary: "Find a narrow topic people already pay for.",
    lessons: [
      {
        id: "r1",
        title: "Demand first, ideas second",
        minutes: 6,
        body: `Most first products fail because they start with "what do I want to make?" Start instead with "what are people already paying for, and where are they unhappy?"

**Three kinds of evidence count:**
1. **Spending:** paid products in the niche with reviews. Reviews prove money changed hands.
2. **Pain:** complaints, 1-3 star reviews of those products, frustrated forum posts.
3. **Volume:** large communities asking the same question again and again.

An idea with all three is worth testing. An idea with none is a hobby.`,
        action: { label: "Generate ideas in Demand Lab", href: "/research" },
      },
      {
        id: "r2",
        title: "How topic scoring works",
        minutes: 5,
        body: `Every topic in Demand Lab gets five 0-10 signals: **Demand**, **Buyer intent**, **Pain**, **Competition** (inverted) and **Your edge**. The score is a weighted sum you can see in full (25/25/20/15/15). There's one hard rule: if buyer intent is below 3, the score is capped at 45, because a topic nobody pays for isn't a product.

The AI gives you a first estimate. **Your job is to check it.** Open the evidence list, spend 20 minutes looking, and adjust the sliders. Your verified score is worth far more than the AI's guess.`,
        action: { label: "Score a topic", href: "/research#score" },
      },
      {
        id: "r3",
        title: "Go narrow",
        minutes: 4,
        body: `"Productivity" is a category. "A Notion system for nurses working 12-hour rotating shifts" is a product. Narrow topics win because:
- you can name the buyer, so copy writes itself;
- competition is thinner;
- the buyer feels it was made for them.

Use the **sharper angle** suggestion on each scored topic as a starting point.`,
        action: { label: "Refine your topics", href: "/research#score" },
      },
      {
        id: "r4",
        title: "Partnering with creators",
        minutes: 7,
        body: `If you don't have an audience, borrow one. Find a creator with an engaged audience and no product. Read their most popular posts and comments: what do people keep asking? Propose that you build and run a product they promote, for a revenue split (40-60% is common).

You handle research, building, the sales page, checkout, delivery and support. They supply expertise and promotion. Track every conversation in the Partner CRM.`,
        action: { label: "Open Partner CRM", href: "/partners" },
      },
    ],
  },
  {
    key: "build",
    title: "2. Build",
    summary: "Outline, draft, and edit a product worth paying for.",
    lessons: [
      {
        id: "b1",
        title: "The outline is the product",
        minutes: 5,
        body: `Every section must move the buyer one step closer to the promise. If a section doesn't, cut it. Generate an outline, then reorder, rename, and delete until it reads like a path rather than a table of contents.`,
        action: { label: "Create a product", href: "/products/new" },
      },
      {
        id: "b2",
        title: "Drafting with AI, editing like a human",
        minutes: 8,
        body: `AI drafts are a starting point. Reviewers of every AI product tool agree: the raw output is generic. Make it yours:
- **Add your examples.** Replace every generic example with a real one.
- **Cut 30%.** AI pads. Delete repetition and throat-clearing.
- **Add a tool.** A checklist, worksheet or template at the end of each section is what buyers remember.
- **Fact-check.** Verify every number and claim.

The word counter on each product tracks your progress; aim to have personally edited every section before you publish.`,
        action: { label: "Go to your products", href: "/products" },
      },
      {
        id: "b3",
        title: "Pricing",
        minutes: 4,
        body: `Price on the value of the result, not the page count. Rough guides: templates $9-29, focused guides $19-49, workbooks/toolkits $29-79, courses $97+. Start lower to collect reviews, then raise it. Never inflate a "total value" number.`,
        action: { label: "Set your price", href: "/products" },
      },
    ],
  },
  {
    key: "launch",
    title: "3. Launch",
    summary: "Write the copy, publish the store page, get the first sale.",
    lessons: [
      {
        id: "l1",
        title: "Your launch asset checklist",
        minutes: 5,
        body: `Before launch you need: a positioning statement, a sales page, an FAQ, a welcome email, and a launch email sequence. Launch Studio has an agent for each. Run them, then edit, just like the product.`,
        action: { label: "Open Launch Studio", href: "/studio" },
      },
      {
        id: "l2",
        title: "Publishing and checkout",
        minutes: 4,
        body: `Publishing a product gives it a public store page with checkout and automatic delivery. Buyers get a private download page with every section. With Stripe connected, payments are real; without it, the store runs in test mode so you can try the full flow.`,
        action: { label: "Publish a product", href: "/products" },
      },
      {
        id: "l3",
        title: "Showing up where buyers already are",
        minutes: 7,
        body: `Paid ads are optional. Buyers already gather in communities. The Audience Finder suggests communities, creators and search queries for your product. Then:
1. Read the rules.
2. Answer questions generously for a week before you mention anything.
3. Share a free piece of the product (a checklist) where allowed.
4. Track each channel's status so you know what you've actually done.

Everything the finder returns is a suggestion. Verify each channel exists and fits before you invest time in it.`,
        action: { label: "Find your audience", href: "/distribution" },
      },
    ],
  },
  {
    key: "grow",
    title: "4. Grow",
    summary: "Diagnose, iterate and build the next product.",
    lessons: [
      {
        id: "g1",
        title: "When nothing sells",
        minutes: 6,
        body: `No sales is data. Run a Launch Review: it looks at your product, page, price, distribution activity and assets, scores each area, and gives you a 14-day action plan. The most common cause by far is that too few people have seen the offer.`,
        action: { label: "Run a Launch Review", href: "/review" },
      },
      {
        id: "g2",
        title: "The product ladder",
        minutes: 5,
        body: `Once one product sells, build the next rung: a cheaper entry product that feeds it, or a premium version (templates + guide + walkthrough videos) above it. Each buyer of one rung is the warmest lead for the next.`,
        action: { label: "Generate the next idea", href: "/research" },
      },
      {
        id: "g3",
        title: "The 90-day challenge",
        minutes: 3,
        body: `Everyone starts at zero on the day they join. The leaderboard ranks revenue over your first 90 days. It's opt-in and you can hide yourself any time in Settings. It's there for momentum, not as a promise of results: most people's first product makes little, and that's normal.`,
        action: { label: "View the leaderboard", href: "/leaderboard" },
      },
    ],
  },
];

export const ALL_LESSONS = CURRICULUM.flatMap((s) => s.lessons);
