/**
 * Transparent topic scoring.
 *
 * Every topic is rated on five signals (0-10). The score is a published,
 * weighted sum so a user can always see why a topic scored what it did and
 * change any input they disagree with. Nothing here is a black box.
 */

export type SignalKey = "demand" | "intent" | "pain" | "competition" | "fit";

export type Signals = Record<SignalKey, number>;

export type SignalDef = {
  key: SignalKey;
  label: string;
  weight: number;
  inverted: boolean;
  question: string;
  evidence: string;
};

export const SIGNALS: SignalDef[] = [
  {
    key: "demand",
    label: "Demand",
    weight: 0.25,
    inverted: false,
    question: "How many people are actively looking for this?",
    evidence: "Search volume, subreddit/forum size, recurring questions, follower counts on the topic.",
  },
  {
    key: "intent",
    label: "Buyer intent",
    weight: 0.25,
    inverted: false,
    question: "Is there proof people already pay for solutions?",
    evidence: "Existing paid products with reviews, course sales counts, price points, 'is X worth it' threads.",
  },
  {
    key: "pain",
    label: "Pain",
    weight: 0.2,
    inverted: false,
    question: "How badly and how often does the problem hurt?",
    evidence: "Complaints, 1-3 star reviews of existing products, frustrated forum posts, costly mistakes.",
  },
  {
    key: "competition",
    label: "Competition",
    weight: 0.15,
    inverted: true,
    question: "How crowded is the market? (10 = extremely crowded)",
    evidence: "Number of near-identical products, strength of top sellers, ad saturation.",
  },
  {
    key: "fit",
    label: "Your edge",
    weight: 0.15,
    inverted: false,
    question: "How well can you (or your creator partner) deliver and reach buyers?",
    evidence: "Your expertise, a partner's audience, unique data or access, credibility.",
  },
];

export type Breakdown = {
  key: SignalKey;
  label: string;
  raw: number;
  effective: number;
  weight: number;
  points: number;
}[];

export function clampSignal(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(10, Math.round(v * 10) / 10));
}

export function scoreTopic(signals: Signals): { score: number; breakdown: Breakdown; verdict: Verdict } {
  const breakdown: Breakdown = SIGNALS.map((s) => {
    const raw = clampSignal(signals[s.key]);
    const effective = s.inverted ? 10 - raw : raw;
    const points = Math.round(effective * s.weight * 10 * 10) / 10; // out of weight*100
    return { key: s.key, label: s.label, raw, effective, weight: s.weight, points };
  });
  let score = Math.round(breakdown.reduce((sum, b) => sum + b.points, 0) * 10) / 10;

  // Hard floor: a topic nobody pays for is not a product, whatever else it has.
  const intent = clampSignal(signals.intent);
  if (intent < 3) score = Math.min(score, 45);

  return { score, breakdown, verdict: verdictFor(score, signals) };
}

export type Verdict = { label: "Build it" | "Promising" | "Validate first" | "Skip"; tone: "good" | "ok" | "warn" | "bad"; reason: string };

export function verdictFor(score: number, signals: Signals): Verdict {
  if (clampSignal(signals.intent) < 3)
    return { label: "Skip", tone: "bad", reason: "No evidence that people pay for this yet. Intent below 3 caps the score at 45." };
  if (score >= 75) return { label: "Build it", tone: "good", reason: "Strong demand with proven spending and room to stand out." };
  if (score >= 60) return { label: "Promising", tone: "ok", reason: "Worth building if you can sharpen the angle on your weakest signal." };
  if (score >= 45) return { label: "Validate first", tone: "warn", reason: "Run a cheap test (pre-sale, waitlist, poll) before writing anything." };
  return { label: "Skip", tone: "bad", reason: "The numbers don't support a product here right now." };
}

export function weakestSignal(breakdown: Breakdown) {
  return [...breakdown].sort((a, b) => a.effective - b.effective)[0];
}
