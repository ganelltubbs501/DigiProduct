import { requireUser } from "@/lib/auth";
import { all, parseJSON } from "@/lib/db";
import { SIGNALS, type Signals } from "@/lib/scoring";
import type { IdeasResult, SignalEstimate } from "@/lib/research";
import { IdeaGenerator, IdeaCard } from "@/app/components/IdeaGenerator";
import { NewTopicForm, TopicCard } from "@/app/components/TopicScorer";

export const metadata = { title: "Demand Lab" };

export default async function ResearchPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const user = await requireUser();
  const { topic = "" } = await searchParams;
  const topics = all<{ id: string; name: string; signals_json: string; rationale: string; score: number }>(
    "SELECT id, name, signals_json, rationale, score FROM topics WHERE user_id = ? ORDER BY score DESC, created_at DESC",
    user.id,
  );
  const history = all<{ id: string; result_json: string; created_at: string; mode: string }>(
    "SELECT id, result_json, created_at, mode FROM ideas WHERE user_id = ? ORDER BY created_at DESC LIMIT 5",
    user.id,
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Demand Lab</h1>
          <p>Start from what people already buy. Generate ideas, score them on published criteria, check the evidence yourself, then build the best one.</p>
        </div>
      </div>

      <IdeaGenerator defaultSkills={user.skills} />

      <div className="mt-lg"><NewTopicForm initialTopic={topic} /></div>

      <details className="card mt small">
        <summary><strong>How the score is calculated</strong></summary>
        <table className="table mt">
          <thead><tr><th>Signal</th><th>Weight</th><th>What it measures</th><th>Evidence to look for</th></tr></thead>
          <tbody>
            {SIGNALS.map((s) => (
              <tr key={s.key}><td>{s.label}{s.inverted ? " (inverted)" : ""}</td><td className="num">{s.weight * 100}%</td><td>{s.question}</td><td className="muted">{s.evidence}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="mt" style={{ marginBottom: 0 }}>Score = Σ(signal × weight × 10). Competition is inverted (10 − value). If buyer intent is below 3, the score is capped at 45. Bands: 75+ Build it, 60+ Promising, 45+ Validate first, otherwise Skip.</p>
      </details>

      {topics.length > 0 && (
        <>
          <h2 className="mt-lg">Your topics</h2>
          <div className="stack">
            {topics.map((t) => (
              <TopicCard key={t.id} topic={{ id: t.id, name: t.name, signals: parseJSON<Signals>(t.signals_json, { demand: 5, intent: 5, pain: 5, competition: 5, fit: 5 }), estimate: parseJSON<SignalEstimate | null>(t.rationale, null) }} />
            ))}
          </div>
        </>
      )}

      {history.length > 0 && (
        <>
          <h2 className="mt-lg">Previous idea runs</h2>
          {history.map((h) => {
            const r = parseJSON<IdeasResult>(h.result_json, { value_zone: "", ideas: [] });
            return (
              <details key={h.id} className="card">
                <summary>{new Date(h.created_at).toLocaleString()} · {h.mode === "brief" ? "Creator brief" : "Skills"} · {r.ideas.length} ideas</summary>
                <p className="small muted mt">{r.value_zone}</p>
                <div className="grid grid-2">{r.ideas.map((idea, i) => <IdeaCard key={i} idea={idea} />)}</div>
              </details>
            );
          })}
        </>
      )}
    </>
  );
}
