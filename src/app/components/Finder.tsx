"use client";
import { useActionState } from "react";
import { runFinder, type FinderState } from "@/app/actions/distribution";

export function Finder({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState<FinderState, FormData>(runFinder, undefined);
  return (
    <div className="card">
      <div className="spread">
        <div>
          <h2 style={{ margin: 0 }}>Find where your buyers gather</h2>
          <p className="small muted" style={{ margin: "4px 0 0" }}>Suggests communities, creators and searches. These are suggestions from the AI&apos;s knowledge, not live data, so check that each one exists and allows your kind of post.</p>
        </div>
        <form action={action}>
          <input type="hidden" name="product_id" value={productId} />
          <button className="btn primary" disabled={pending}>{pending ? "Searching…" : "Find audiences"}</button>
        </form>
      </div>
      {state?.error && <div className="notice error mt">{state.error}</div>}
      {state?.result && (
        <div className="grid grid-3 mt small">
          <div><strong>Search for more</strong><ul>{state.result.search_queries.map((q, i) => <li key={i}><code>{q}</code></li>)}</ul></div>
          <div><strong>Creators to partner with</strong><ul>{state.result.creator_types.map((q, i) => <li key={i}>{q}</li>)}</ul></div>
          <div><strong>Watch out</strong><ul>{state.result.warnings.map((q, i) => <li key={i}>{q}</li>)}</ul></div>
        </div>
      )}
    </div>
  );
}
