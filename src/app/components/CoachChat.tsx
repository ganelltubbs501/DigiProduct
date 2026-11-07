"use client";
import { useEffect, useRef, useState } from "react";
import { useStream } from "./useStream";
import { renderMarkdown } from "@/lib/markdown";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = ["What should I work on today?", "How do I find a creator to partner with?", "Is my price too low?", "I have no sales after 3 weeks. What now?"];

export function CoachChat({ initial }: { initial: Msg[] }) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const { text, streaming, error, start } = useStream();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, text]);

  const send = async (msg: string) => {
    const m = msg.trim();
    if (!m || streaming) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: m }]);
    const reply = await start("/api/coach", { message: m });
    setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
  };

  return (
    <div>
      <div className="chat">
        {messages.length === 0 && (
          <div className="card">
            <p className="muted">Ask anything about building, launching or selling. The coach can see your products and progress.</p>
            <div className="row">{STARTERS.map((s) => <button key={s} className="btn small" onClick={() => send(s)}>{s}</button>)}</div>
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "assistant" ? (
            <div key={i} className="msg assistant prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
          ) : (
            <div key={i} className="msg user" style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
          ),
        )}
        {streaming && <div className="msg assistant prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(text || "…") }} />}
        {error && <div className="notice error">{error}</div>}
        <div ref={endRef} />
      </div>
      <form className="row mt" onSubmit={(e) => { e.preventDefault(); send(input); }} style={{ position: "sticky", bottom: 0, background: "var(--bg)", padding: "10px 0" }}>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask the coach…" style={{ flex: 1, minHeight: 48 }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} />
        <button className="btn primary" disabled={streaming || !input.trim()}>Send</button>
      </form>
    </div>
  );
}
