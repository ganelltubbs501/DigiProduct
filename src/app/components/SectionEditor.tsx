"use client";
import { useState, useTransition } from "react";
import { saveSection, deleteSection, moveSection } from "@/app/actions/products";
import { useStream } from "./useStream";

type Section = { id: string; position: number; title: string; brief: string; content: string };

function words(s: string) {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function SectionEditor({ section, index, total }: { section: Section; index: number; total: number }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [brief, setBrief] = useState(section.brief);
  const [content, setContent] = useState(section.content);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(true);
  const [saving, startSave] = useTransition();
  const { streaming, error, start, stop } = useStream();

  const draft = async () => {
    setOpen(true);
    const full = await start(`/api/sections/${section.id}/draft`, { notes, title, brief }, (t) => setContent(t));
    setContent(full.trim());
    setSaved(true); // the server saves the finished draft
  };

  const save = () =>
    startSave(async () => {
      await saveSection(section.id, { title, brief, content });
      setSaved(true);
    });

  const n = words(content);
  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="spread">
        <button type="button" onClick={() => setOpen(!open)} style={{ all: "unset", cursor: "pointer", flex: 1 }}>
          <strong>{index + 1}. {title}</strong>
          <div className="small muted">{brief}</div>
        </button>
        <div className="row">
          <span className={`badge ${n >= 800 ? "good" : n > 0 ? "warn" : ""}`}>{n.toLocaleString()} words</span>
          <form action={moveSection}><input type="hidden" name="id" value={section.id} /><input type="hidden" name="dir" value="up" /><button className="btn small" disabled={index === 0} aria-label="Move up">↑</button></form>
          <form action={moveSection}><input type="hidden" name="id" value={section.id} /><input type="hidden" name="dir" value="down" /><button className="btn small" disabled={index === total - 1} aria-label="Move down">↓</button></form>
          <button type="button" className="btn small" onClick={() => setOpen(!open)}>{open ? "Close" : "Edit"}</button>
        </div>
      </div>
      {open && (
        <div className="mt">
          <div className="grid grid-2">
            <div className="field"><label>Title</label><input type="text" value={title} onChange={(e) => { setTitle(e.target.value); setSaved(false); }} /></div>
            <div className="field"><label>Brief</label><input type="text" value={brief} onChange={(e) => { setBrief(e.target.value); setSaved(false); }} /></div>
          </div>
          <div className="field">
            <label>Your notes for the AI <span className="hint">(real examples, stories, numbers: this is what makes it yours)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ minHeight: 60 }} />
          </div>
          <div className="row" style={{ marginBottom: 10 }}>
            {streaming ? (
              <button type="button" className="btn" onClick={stop}>Stop</button>
            ) : (
              <button type="button" className="btn primary" onClick={draft}>{content ? "Redraft with AI" : "Draft with AI"}</button>
            )}
            <button type="button" className="btn" onClick={save} disabled={saved || saving || streaming}>{saving ? "Saving…" : saved ? "Saved" : "Save"}</button>
            <form action={deleteSection} onSubmit={(e) => { if (!confirm("Delete this section?")) e.preventDefault(); }}>
              <input type="hidden" name="id" value={section.id} /><button className="btn danger">Delete</button>
            </form>
          </div>
          {error && <div className="notice error">{error}</div>}
          <textarea className="editor" value={content} readOnly={streaming} onChange={(e) => { setContent(e.target.value); setSaved(false); }} placeholder="Write in Markdown, or draft with AI and then edit." />
        </div>
      )}
    </div>
  );
}
