"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { AIError } from "@/lib/ai";
import { get, id, now, run } from "@/lib/db";
import { estimateSignals, estimatesToSignals, ideasFromBrief, ideasFromSkills, type IdeasResult } from "@/lib/research";
import { clampSignal, scoreTopic, type Signals } from "@/lib/scoring";

export type IdeasState = { result?: IdeasResult; error?: string } | undefined;

export async function generateIdeas(_: IdeasState, form: FormData): Promise<IdeasState> {
  const user = await requireUser();
  const mode = String(form.get("mode")) === "brief" ? "brief" : "skills";
  const f = (k: string) => String(form.get(k) ?? "").trim();
  try {
    let input: Record<string, string>;
    let result: IdeasResult;
    if (mode === "skills") {
      input = { skills: f("skills"), experience: f("experience"), interests: f("interests") };
      if (!input.skills) return { error: "Tell us at least one skill." };
      result = await ideasFromSkills(input as { skills: string; experience: string; interests: string });
      run("UPDATE users SET skills = ? WHERE id = ?", input.skills, user.id);
    } else {
      input = { audience: f("audience"), expertise: f("expertise"), problem: f("problem"), result: f("result") };
      if (!input.audience) return { error: "Describe the audience." };
      result = await ideasFromBrief(input as { audience: string; expertise: string; problem: string; result: string });
    }
    run("INSERT INTO ideas (id, user_id, mode, input_json, result_json, created_at) VALUES (?, ?, ?, ?, ?, ?)", id(), user.id, mode, JSON.stringify(input), JSON.stringify(result), now());
    revalidatePath("/research");
    return { result };
  } catch (err) {
    return { error: err instanceof AIError ? err.message : "Something went wrong generating ideas." };
  }
}

export type ScoreState = { error?: string; ok?: boolean } | undefined;

export async function scoreNewTopic(_: ScoreState, form: FormData): Promise<ScoreState> {
  const user = await requireUser();
  const topic = String(form.get("topic") ?? "").trim();
  const context = String(form.get("context") ?? "").trim();
  if (!topic) return { error: "Enter a topic." };
  try {
    const est = await estimateSignals(topic, context || user.skills);
    const signals = estimatesToSignals(est);
    const { score, breakdown } = scoreTopic(signals);
    run(
      "INSERT INTO topics (id, user_id, name, signals_json, score, breakdown_json, rationale, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      id(), user.id, topic, JSON.stringify(signals), score, JSON.stringify(breakdown), JSON.stringify(est), now(),
    );
    revalidatePath("/research");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof AIError ? err.message : "Something went wrong scoring the topic." };
  }
}

export async function saveTopicSignals(topicId: string, signals: Signals) {
  const user = await requireUser();
  if (!get("SELECT 1 FROM topics WHERE id = ? AND user_id = ?", topicId, user.id)) return;
  const clean: Signals = {
    demand: clampSignal(signals.demand),
    intent: clampSignal(signals.intent),
    pain: clampSignal(signals.pain),
    competition: clampSignal(signals.competition),
    fit: clampSignal(signals.fit),
  };
  const { score, breakdown } = scoreTopic(clean);
  run("UPDATE topics SET signals_json = ?, score = ?, breakdown_json = ? WHERE id = ?", JSON.stringify(clean), score, JSON.stringify(breakdown), topicId);
  revalidatePath("/research");
}

export async function deleteTopic(form: FormData) {
  const user = await requireUser();
  run("DELETE FROM topics WHERE id = ? AND user_id = ?", String(form.get("id")), user.id);
  revalidatePath("/research");
}
