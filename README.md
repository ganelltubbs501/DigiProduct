# DigiProduct

An all-in-one, self-hosted platform for researching, building, launching and selling digital products (ebooks, guides, templates, workbooks, courses).

It covers the whole build-and-launch loop: **find a topic people already pay for → draft the product → write the launch copy → publish with checkout → put it in front of buyers → diagnose and repeat.** Everything runs in one app and shares one database.

## Modules

| Module | Route | What it does |
|---|---|---|
| **Dashboard** | `/dashboard` | Revenue, sales, launch checklist, next step, pipeline and Academy progress in one place. |
| **Academy** | `/academy` | A four-stage curriculum (Research → Build → Launch → Grow). Each lesson ends with a button into the matching tool, and progress is tracked. |
| **Demand Lab** | `/research` | Idea generation from your skills or from a creator brief, plus **transparent topic scoring** on five signals with published weights. AI estimates are a starting point: every signal is a slider you can change, and each topic lists what evidence to check. |
| **Products** | `/products` | AI outline, then AI drafting section by section (streamed, with your own notes and examples fed in), editable Markdown, reordering, word counts, pricing and a store listing. |
| **Launch Studio** | `/studio` | 22 specialised copy agents (positioning, headlines, objections, offer, sales page, listing, FAQ, guarantee, launch sequence, welcome email, newsletter, Meta ads, search ads, video scripts, threads, content calendar, community posts, creator pitch, follow-ups, affiliate kit, support replies, review requests). Output is saved per product and editable. |
| **Storefront** | `/p/[slug]` | Public product page with Stripe Checkout and automatic delivery to a private buyer page (`/download/[token]`) plus a Markdown download. Runs in test mode without Stripe. |
| **Audience Finder** | `/distribution` | Suggests communities, creator types and search queries where buyers gather, then tracks each channel (idea → researching → active → converting → dropped). |
| **Partner CRM** | `/partners` | Kanban pipeline for creator partnerships on revenue splits: activity log, linked products, and automatic owed/your-share accounting. |
| **Sales** | `/sales` | All orders with partner splits. |
| **Launch Review** | `/review` | A scored diagnosis (market, offer, product completeness, sales page, distribution effort, assets) from real product data, with a 14-day action plan. Flags products live 60+ days with no sales. |
| **90-Day Challenge** | `/leaderboard` | Revenue leaderboard over each member's first 90 days. Opt-in and can be hidden. |
| **Coach** | `/coach` | Streaming AI coach that sees your products, progress and sales. |

## Design choices

These respond to the common criticisms of existing all-in-one programs:

- **No black-box scoring.** Score = Σ(signal × weight × 10). Weights: demand 25%, buyer intent 25%, pain 20%, competition 15% (inverted), your edge 15%. If buyer intent is below 3, the score is capped at 45. The formula is shown in the app and unit-tested in `tests/scoring.test.ts`.
- **Honest about AI suggestions.** The Audience Finder labels its results as model suggestions to verify, not live data. Copy agents leave `[PLACEHOLDER]` slots instead of inventing testimonials. Prompts forbid income claims.
- **Built for editing.** Drafts take your notes and examples as input, word counts are visible, and the app reminds you to edit before publishing.
- **One dashboard.** Research, products, copy, store, CRM, coaching and learning share the same data.
- **You own it.** Self-hosted, SQLite, no subscription lock-in on the software.

## Stack

- Next.js 15 (App Router, server actions, streaming route handlers), React 19, TypeScript
- SQLite via Node's built-in `node:sqlite` (no native build step)
- Claude via `@anthropic-ai/sdk` (structured outputs with Zod, streaming for long text, server-side refusal fallbacks), default model `claude-opus-5-5`
- Stripe Checkout (optional)

## Getting started

Requires Node.js 22.13 or later.

```bash
npm install
cp .env.example .env.local   # add your keys (all optional)
npm run dev                  # http://localhost:3000
```

Sign up at `/signup`. The first account works like any other: there's no admin role.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | No | Enables real AI output. Without it, **demo mode** returns canned output so you can click through every flow. |
| `DP_MODEL` | No | Override the Claude model (default `claude-opus-5-5`). |
| `STRIPE_SECRET_KEY` | No | Enables real payments. Without it the store runs in **test mode** and orders are marked paid immediately. |
| `STRIPE_WEBHOOK_SECRET` | No | Verifies `POST /api/stripe/webhook` (`checkout.session.completed`). Orders are also confirmed when the buyer returns from Checkout. |
| `APP_URL` | With Stripe | Public base URL for Stripe redirects. |
| `DATABASE_PATH` | No | SQLite file location (default `./data/digiproduct.db`). |

### Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm start          # run the production build
npm run typecheck  # tsc --noEmit
npm test           # unit tests (node:test)
```

## Project layout

```
src/
  lib/
    ai.ts            Claude client: generateObject (structured) + streamText, demo-mode fallback
    scoring.ts       Transparent topic scoring (pure, unit-tested)
    research.ts      Ideas, signal estimates, outlines, section prompts
    agents.ts        Launch Studio agent catalog
    distribution.ts  Audience Finder
    review.ts        Launch Review
    curriculum.ts    Academy content
    payments.ts      Stripe Checkout / test mode, delivery tokens, webhook
    products.ts      Product queries and helpers
    progress.ts      Journey metrics, checklist, next step
    auth.ts          Email/password auth (scrypt), session cookies
    db.ts, schema.ts SQLite connection and schema
    markdown.ts      Markdown rendering with raw HTML disabled
  app/
    (public)/        Landing, login, signup
    (store)/         Public store page and buyer download page
    (app)/           Authenticated platform pages
    actions/         Server actions
    api/             Streaming endpoints (drafting, studio, coach), checkout, download, webhook
    components/      Client components
tests/               Unit tests
```

## Notes and limits

- The Audience Finder doesn't browse the web. Its suggestions come from the model's knowledge and need checking. Adding Claude's web search tool to `findAudiences` is a natural next step.
- Uploaded files (PDFs, images) aren't supported yet. Products are delivered as rendered pages and Markdown.
- Refunds are handled in Stripe; the order status here isn't updated on refund.
- Sessions and data live in a single SQLite file. Back it up like any database.
