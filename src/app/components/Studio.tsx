"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AGENTS, AGENT_CATEGORIES } from "@/lib/agents";
import { useStream } from "./useStream";

export function Studio({ productId, doneKeys }: { productId: string; doneKeys: string[] }) {
  const router = useRouter();
  const [agentKey, setAgentKey] = useState("positioning");
  const [extra, setExtra] = useState("");
  const { text, streaming, error, start, stop } = useStream();
  const agent = AGENTS.find((a) => a.key === agentKey)!;
  const done = new Set(doneKeys);

  const run = async () => {
    await start("/api/studio", { productId, agent: agentKey, extra });
    router.refresh();
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)", alignItems: "start" }}>
      <div className="card" style={{ maxHeight: 640, overflowY: "auto" }}>
        {AGENT_CATEGORIES.map((cat) => (
          <div key={cat} style={{ marginBottom: 12 }}>
            <div className="nav-label" style={{ padding: "0 0 4px" }}>{cat}</div>
            {AGENTS.filter((a) => a.category === cat).map((a) => (
              <button
                key={a.key} type="button" onClick={() => setAgentKey(a.key)}
                className="deal" style={{ width: "100%", textAlign: "left", cursor: "pointer", marginTop: 4, borderColor: a.key === agentKey ? "var(--accent)" : undefined, font: "inherit" }}
              >
                <div className="spread"><strong>{a.name}</strong>{done.has(a.key) && <span className="badge good">made</span>}</div>
                <div className="small muted">{a.description}</div>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="card">
        <h2>{agent.name}</h2>
        <p className="small muted">{agent.instructions}</p>
        <div className="field"><label>Extra instructions <span className="hint">(optional: tone, angle, length)</span></label><textarea value={extra} onChange={(e) => setExtra(e.target.value)} style={{ minHeight: 60 }} /></div>
        <div className="row">
          {streaming ? <button className="btn" onClick={stop}>Stop</button> : <button className="btn primary" onClick={run}>Run agent</button>}
          <span className="small muted">Output is saved to this product&apos;s assets.</span>
        </div>
        {error && <div className="notice error mt">{error}</div>}
        {(text || streaming) && <div className="stream-out mt">{text || "…"}</div>}
      </div>
      <style>{`@media (max-width: 860px) { .grid[style*="1.4fr"] { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
