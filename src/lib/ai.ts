import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

/**
 * One place that talks to Claude. Every tool in the platform (research,
 * drafting, copy agents, audience finder, coach, launch review) goes
 * through these two functions.
 *
 * With no ANTHROPIC_API_KEY set, each call returns the caller-supplied demo
 * output so the whole platform can be clicked through offline.
 */

export const MODEL = process.env.DP_MODEL || "claude-opus-5-5";

type Effort = "low" | "medium" | "high" | "xhigh" | "max";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export class AIError extends Error {}

function describeError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "The Claude API key was rejected. Check ANTHROPIC_API_KEY.";
  if (err instanceof Anthropic.RateLimitError) return "Claude is rate limited right now. Try again in a minute.";
  if (err instanceof Anthropic.BadRequestError) return `Claude rejected the request: ${err.message}`;
  if (err instanceof Anthropic.APIError) return `Claude API error (${err.status ?? "network"}): ${err.message}`;
  return err instanceof Error ? err.message : String(err);
}

// The platform's shared voice. Kept identical across calls so it caches.
const HOUSE_STYLE = `You are part of DigiProduct, a platform that helps people research, build, launch and sell digital products (ebooks, templates, guides, courses, toolkits).
Principles you always follow:
- Start from evidence of demand, never from vague ideas. Say what evidence would confirm or kill an idea.
- Be specific and concrete. Name real audiences, real situations, real numbers where you can, and say when a number is an estimate.
- Never promise income or guaranteed results. Never invent testimonials, reviews, sales figures or credentials.
- Write plainly. No hype words ("game-changer", "unlock", "skyrocket"), no filler.`;

export async function generateObject<S extends z.ZodType>(opts: {
  schema: S;
  system: string;
  prompt: string;
  effort?: Effort;
  maxTokens?: number;
  demo: () => z.infer<S>;
}): Promise<z.infer<S>> {
  if (!aiEnabled()) return opts.demo();
  try {
    const response = await getClient().beta.messages.parse({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [
        { type: "text", text: HOUSE_STYLE },
        { type: "text", text: opts.system },
      ],
      output_config: { effort: opts.effort ?? "medium", format: betaZodOutputFormat(opts.schema) },
      messages: [{ role: "user", content: opts.prompt }],
    });
    if (response.stop_reason === "refusal") throw new AIError("Claude declined this request. Try rephrasing it.");
    if (response.stop_reason === "max_tokens") throw new AIError("The response was too long and got cut off. Try a narrower request.");
    if (response.parsed_output == null) throw new AIError("Claude returned output that didn't match the expected format.");
    return response.parsed_output as z.infer<S>;
  } catch (err) {
    if (err instanceof AIError) throw err;
    throw new AIError(describeError(err));
  }
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

/**
 * Streams plain text back as a web ReadableStream. `onDone` receives the full
 * text so callers can persist it.
 */
export function streamText(opts: {
  system: string;
  messages: ChatTurn[];
  effort?: Effort;
  maxTokens?: number;
  demo: () => string;
  onDone?: (text: string) => void | Promise<void>;
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  if (!aiEnabled()) {
    const text = opts.demo();
    return new ReadableStream({
      async start(controller) {
        const words = text.split(/(\s+)/);
        for (let i = 0; i < words.length; i += 6) {
          try {
            controller.enqueue(encoder.encode(words.slice(i, i + 6).join("")));
          } catch {
            break;
          }
          await new Promise((r) => setTimeout(r, 15));
        }
        await opts.onDone?.(text);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      },
    });
  }

  return new ReadableStream({
    async start(controller) {
      let full = "";
      // Keep generating (and saving) even if the browser disconnects mid-stream.
      const push = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          /* client went away */
        }
      };
      try {
        const stream = getClient().beta.messages.stream({
          model: MODEL,
          max_tokens: opts.maxTokens ?? 64000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: [
            { type: "text", text: HOUSE_STYLE },
            { type: "text", text: opts.system },
          ],
          output_config: { effort: opts.effort ?? "medium" },
          messages: opts.messages,
        });
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            full += event.delta.text;
            push(event.delta.text);
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          const note = "\n\n[Claude declined to continue this request.]";
          full += note;
          push(note);
        }
        await opts.onDone?.(full);
      } catch (err) {
        push(`\n\n[Error: ${describeError(err)}]`);
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });
}

export function textResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}

export type Source = { title: string; url: string };
export type WebResearch = { notes: string; sources: Source[] };

/** Live web research is on whenever AI is on, unless DP_WEB_RESEARCH=off. */
export function webResearchEnabled(): boolean {
  return aiEnabled() && process.env.DP_WEB_RESEARCH !== "off";
}

/**
 * Runs Claude with the web search tool and returns its research notes plus
 * every page it looked at. Callers feed the notes into a structured step, so
 * estimates rest on current evidence instead of the model's memory.
 */
export async function researchWeb(opts: { system: string; prompt: string; maxSearches?: number }): Promise<WebResearch> {
  const messages: Anthropic.Beta.Messages.BetaMessageParam[] = [{ role: "user", content: opts.prompt }];
  const sources = new Map<string, Source>();
  let notes = "";
  try {
    // A long server-side search turn can pause; send it back (unchanged) to let it continue.
    for (let turn = 0; turn < 4; turn++) {
      const response = await getClient().beta.messages.create({
        model: MODEL,
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system: [
          { type: "text", text: HOUSE_STYLE },
          { type: "text", text: opts.system },
        ],
        output_config: { effort: "medium" },
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: opts.maxSearches ?? 6 }],
        messages,
      });
      for (const block of response.content) {
        if (block.type === "text") notes += block.text;
        if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
          for (const r of block.content) if (!sources.has(r.url)) sources.set(r.url, { title: r.title || r.url, url: r.url });
        }
      }
      if (response.stop_reason === "refusal") throw new AIError("Claude declined this research request.");
      if (response.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: response.content });
    }
  } catch (err) {
    if (err instanceof AIError) throw err;
    throw new AIError(describeError(err));
  }
  return { notes: notes.trim(), sources: [...sources.values()].slice(0, 25) };
}
