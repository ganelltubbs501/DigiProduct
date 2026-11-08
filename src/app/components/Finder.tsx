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
          <p className="small muted" style={{ margin: "4px 0 0" }}>Searches the web for communities, creators and searches where your buyers gather. Always check a community&apos;s rules before you post.</p>
        </div>
        <form action={action}>
          <input type="hidden" name="product_id" value={productId} />
          <button className="btn primary" disabled={pending}>{pending ? "Searching…" : "Find audiences"}</button>
        </form>
      </div>
      {state?.error && <div className="notice error mt">{state.error}</div>}
      {state?.result && (
        <div className="small mt">
          {state.result.researched ? (
            <span className="badge good">Based on live web research · {state.result.sources?.length ?? 0} sources</span>
          ) : (
            <span className="badge warn">From model knowledge, not live data: verify each channel exists</span>
          )}
          {state.result.sources && state.result.sources.length > 0 && (
            <details style={{ marginTop: 6 }}>
              <summary>Sources</summary>
              <ul style={{ margin: "4px 0" }}>
                {state.result.sources.map((s) => (
                  <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer nofollow">{s.title}</a></li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
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
