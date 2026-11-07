"use client";
import { useState, useTransition } from "react";
import { updateAsset } from "@/app/actions/studio";

export function AssetBody({ id, content, html }: { id: string; content: string; html: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="mt">
      <div className="row" style={{ marginBottom: 8 }}>
        <button className="btn small" onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "Copied" : "Copy"}</button>
        {editing ? (
          <button className="btn small primary" disabled={pending} onClick={() => start(async () => { await updateAsset(id, value); setEditing(false); })}>{pending ? "Saving…" : "Save"}</button>
        ) : (
          <button className="btn small" onClick={() => setEditing(true)}>Edit</button>
        )}
      </div>
      {editing ? <textarea className="editor" value={value} onChange={(e) => setValue(e.target.value)} /> : <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />}
    </div>
  );
}
