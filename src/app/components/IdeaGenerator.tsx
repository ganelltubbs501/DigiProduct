"use client";
import { useActionState, useState } from "react";
import { generateIdeas, type IdeasState } from "@/app/actions/research";
import { createProduct } from "@/app/actions/products";
import type { Idea } from "@/lib/research";

export function IdeaGenerator({ defaultSkills }: { defaultSkills: string }) {
  const [mode, setMode] = useState<"skills" | "brief">("skills");
  const [state, action, pending] = useActionState<IdeasState, FormData>(generateIdeas, undefined);

  return (
    <div className="card">
      <div className="spread">
        <h2 style={{ margin: 0 }}>Generate product ideas</h2>
        <div className="row">
          <button type="button" className={`btn small${mode === "skills" ? " primary" : ""}`} onClick={() => setMode("skills")}>From my skills</button>
          <button type="button" className={`btn small${mode === "brief" ? " primary" : ""}`} onClick={() => setMode("brief")}>From a creator brief</button>
        </div>
      </div>
      <form action={action} className="mt">
        <input type="hidden" name="mode" value={mode} />
        {mode === "skills" ? (
          <div className="grid grid-3">
            <div className="field"><label>Skills</label><textarea name="skills" defaultValue={defaultSkills} placeholder="e.g. Excel, bookkeeping, teaching" required /></div>
            <div className="field"><label>Experience</label><textarea name="experience" placeholder="e.g. 8 years as an accountant for restaurants" /></div>
            <div className="field"><label>Communities / interests</label><textarea name="interests" placeholder="e.g. home cooking, r/smallbusiness" /></div>
          </div>
        ) : (
          <div className="grid grid-2">
            <div className="field"><label>Creator&apos;s audience</label><textarea name="audience" placeholder="e.g. 120k YouTube subscribers, beginner home bakers" required /></div>
            <div className="field"><label>Creator&apos;s expertise</label><textarea name="expertise" placeholder="e.g. sourdough, small-batch baking business" /></div>
            <div className="field"><label>Problem the audience has</label><textarea name="problem" placeholder="Read their top videos' comments: what do people keep asking?" /></div>
            <div className="field"><label>Result they want</label><textarea name="result" placeholder="e.g. sell bread at the farmers market" /></div>
          </div>
        )}
        <button className="btn primary" disabled={pending}>{pending ? "Thinking…" : "Generate ideas"}</button>
      </form>
      {state?.error && <div className="notice error mt">{state.error}</div>}
      {state?.result && (
        <div className="mt-lg">
          <div className="notice info">{state.result.value_zone}</div>
          <div className="grid grid-2">
            {state.result.ideas.map((idea, i) => <IdeaCard key={i} idea={idea} />)}
          </div>
        </div>
      )}
    </div>
  );
}

export function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <div className="card" style={{ background: "var(--surface-2)", boxShadow: "none" }}>
      <div className="spread"><h3 style={{ margin: 0 }}>{idea.title}</h3><span className="badge">{idea.kind}</span></div>
      <p className="small mt"><strong>For:</strong> {idea.audience}<br /><strong>Problem:</strong> {idea.problem}<br /><strong>Result:</strong> {idea.promise}</p>
      <p className="small muted">{idea.why_it_sells}</p>
      <details className="small"><summary>Check demand before building</summary><ul>{idea.evidence_to_check.map((e, i) => <li key={i}>{e}</li>)}</ul></details>
      <div className="row mt">
        <a className="btn small" href={`/research?topic=${encodeURIComponent(idea.title + " for " + idea.audience)}#score`}>Score it</a>
        <form action={createProduct}>
          {(["title", "kind", "audience", "problem", "promise"] as const).map((k) => <input key={k} type="hidden" name={k} value={idea[k]} />)}
          <input type="hidden" name="price" value={idea.suggested_price_usd} />
          <button className="btn small primary">Build this (${idea.suggested_price_usd})</button>
        </form>
      </div>
    </div>
  );
}
