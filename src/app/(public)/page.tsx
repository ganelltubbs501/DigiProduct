import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

const MODULES = [
  { name: "Demand Lab", stage: "Research", text: "Generate ideas from your skills or a creator brief, then score topics on five published signals. You see every number and can change any of them." },
  { name: "Product Builder", stage: "Build", text: "Turn a topic into an outline, then draft each section with AI and edit it in place. Word counts show how much is really done." },
  { name: "Launch Studio", stage: "Launch", text: "22 specialised copy agents: positioning, sales pages, FAQs, email sequences, ads, social, outreach and support." },
  { name: "Storefront", stage: "Launch", text: "Publish a product page with checkout (Stripe) and automatic delivery to a private buyer page." },
  { name: "Audience Finder", stage: "Distribute", text: "Suggestions for communities, creators and searches where your buyers already gather, plus a tracker for what you've done in each." },
  { name: "Partner CRM", stage: "Distribute", text: "Pipeline for creator partnerships on revenue splits, from first message to launch, with automatic split accounting." },
  { name: "Coach", stage: "Support", text: "An AI coach that knows your products, sales and progress and answers around the clock." },
  { name: "Launch Review", stage: "Grow", text: "No sales yet? Get a scored diagnosis of market, offer, page, distribution and assets, with a 14-day action plan." },
];

export default async function Landing() {
  if (await currentUser()) redirect("/dashboard");
  return (
    <>
      <section className="hero">
        <h1>Research, build, launch and sell digital products from one dashboard.</h1>
        <p>
          DigiProduct puts the whole process in one place: find a topic people already pay for, write the product,
          publish it with checkout, and get it in front of buyers.
        </p>
        <div className="row mt">
          <Link href="/signup" className="btn primary">Start building</Link>
          <Link href="/login" className="btn">Log in</Link>
        </div>
      </section>

      <section className="grid grid-4">
        {[
          ["1", "Research", "Start from demand"],
          ["2", "Build", "Outline, draft, edit"],
          ["3", "Launch", "Copy, store, checkout"],
          ["4", "Grow", "Distribute, review, repeat"],
        ].map(([n, t, s]) => (
          <div key={n} className="card">
            <div className="muted small">Stage {n}</div>
            <h3 style={{ margin: "4px 0" }}>{t}</h3>
            <div className="muted small">{s}</div>
          </div>
        ))}
      </section>

      <h2 className="mt-lg">What&apos;s inside</h2>
      <section className="grid grid-2">
        {MODULES.map((m) => (
          <div key={m.name} className="card">
            <div className="spread">
              <h3 style={{ margin: 0 }}>{m.name}</h3>
              <span className="badge">{m.stage}</span>
            </div>
            <p className="muted small mt" style={{ marginBottom: 0 }}>{m.text}</p>
          </div>
        ))}
      </section>

      <section className="card mt-lg" style={{ marginBottom: 60 }}>
        <h2>How it&apos;s different</h2>
        <ul>
          <li><strong>You can see how topics are scored.</strong> The weights are published, and the AI&apos;s estimates are a starting point you&apos;re expected to check.</li>
          <li><strong>One dashboard.</strong> Research, product, copy, store, CRM and coaching share the same data.</li>
          <li><strong>Plain about results.</strong> No income claims. Most first products earn little, and the tools are built to help you diagnose why and try again.</li>
          <li><strong>You own it.</strong> It&apos;s open source and self-hosted. Your products, buyers and data stay on your server.</li>
        </ul>
      </section>
    </>
  );
}
