"use client";
import { useActionState, useState, useTransition } from "react";
import { scoreNewTopic, saveTopicSignals, deleteTopic, type ScoreState } from "@/app/actions/research";
import { createProduct } from "@/app/actions/products";
import { SIGNALS, scoreTopic, weakestSignal, type Signals } from "@/lib/scoring";
import type { SignalEstimate } from "@/lib/research";

export function NewTopicForm({ initialTopic }: { initialTopic: string }) {
  const [state, action, pending] = useActionState<ScoreState, FormData>(scoreNewTopic, undefined);
  return (
    <form action={action} className="card" id="score">
      <h2>Score a topic</h2>
      <p className="small muted">The AI estimates five signals from what it knows. Every number is editable, and the full formula is under "How the score is calculated".</p>
      <div className="grid grid-2">
        <div className="field"><label>Topic</label><input type="text" name="topic" defaultValue={initialTopic} placeholder="e.g. Meal-prep system for night-shift nurses" required /></div>
        <div className="field"><label>About you or your partner <span className="hint">(optional)</span></label><input type="text" name="context" placeholder="e.g. I'm a nurse; partner has 40k IG followers" /></div>
      </div>
      <button className="btn primary" disabled={pending}>{pending ? "Estimating…" : "Score topic"}</button>
      {state?.error && <div className="notice error mt">{state.error}</div>}
    </form>
  );
}

type TopicRow = { id: string; name: string; signals: Signals; estimate: SignalEstimate | null };

export function TopicCard({ topic }: { topic: TopicRow }) {
  const [signals, setSignals] = useState<Signals>(topic.signals);
  const [saving, startSaving] = useTransition();
  const [dirty, setDirty] = useState(false);
  const { score, breakdown, verdict } = scoreTopic(signals);
  const weakest = weakestSignal(breakdown);
  const reasoning = new Map(topic.estimate?.estimates.map((e) => [e.key, e]) ?? []);

  return (
    <div className="card">
      <div className="spread">
        <div>
          <h3 style={{ margin: 0 }}>{topic.name}</h3>
          <span className={`badge ${verdict.tone}`}>{verdict.label}</span> <span className="small muted">{verdict.reason}</span>
        </div>
        <div className="score-ring" title="Score out of 100">{score}</div>
      </div>

      <div className="grid grid-2 mt">
        {SIGNALS.map((s) => {
          const b = breakdown.find((x) => x.key === s.key)!;
          const r = reasoning.get(s.key);
          return (
            <div key={s.key}>
              <div className="spread small">
                <strong>{s.label}{s.inverted ? " (lower is better)" : ""}</strong>
                <span className="muted">{signals[s.key]}/10 → {b.points} of {s.weight * 100} pts</span>
              </div>
              <input
                type="range" min={0} max={10} step={0.5} value={signals[s.key]} aria-label={s.label}
                onChange={(e) => { setSignals({ ...signals, [s.key]: Number(e.target.value) }); setDirty(true); }}
              />
              <div className="small muted">{r ? r.reasoning : s.question}</div>
            </div>
          );
        })}
      </div>

      {topic.estimate && (
        <div className="grid grid-2 mt">
          <div className="small">
            <strong>Verify with:</strong>
            <ul style={{ margin: "4px 0" }}>{topic.estimate.evidence_to_check.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </div>
          <div className="small">
            <strong>Sharper angle:</strong> {topic.estimate.sharper_angle}
            <div className="muted mt">Weakest signal: <strong>{weakest.label}</strong>. Improving it is the fastest way to raise the score.</div>
          </div>
        </div>
      )}

      <div className="row mt">
        <button className="btn small" disabled={!dirty || saving} onClick={() => startSaving(async () => { await saveTopicSignals(topic.id, signals); setDirty(false); })}>
          {saving ? "Saving…" : dirty ? "Save my adjustments" : "Saved"}
        </button>
        <form action={createProduct}>
          <input type="hidden" name="title" value={topic.estimate?.sharper_angle || topic.name} />
          <input type="hidden" name="promise" value="" />
          <button className="btn small primary">Build a product</button>
        </form>
        <form action={deleteTopic}><input type="hidden" name="id" value={topic.id} /><button className="btn small danger">Delete</button></form>
      </div>
    </div>
  );
}
