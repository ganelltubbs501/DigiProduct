import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { get } from "@/lib/db";
import { ALL_LESSONS, CURRICULUM } from "@/lib/curriculum";
import { renderMarkdown } from "@/lib/markdown";
import { toggleLesson } from "@/app/actions/academy";

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const user = await requireUser();
  const idx = ALL_LESSONS.findIndex((l) => l.id === lessonId);
  if (idx < 0) notFound();
  const lesson = ALL_LESSONS[idx];
  const stage = CURRICULUM.find((s) => s.lessons.includes(lesson))!;
  const done = Boolean(get("SELECT 1 FROM lesson_progress WHERE user_id = ? AND lesson_id = ?", user.id, lesson.id));
  const next = ALL_LESSONS[idx + 1];

  return (
    <div style={{ maxWidth: 760 }}>
      <p className="small"><Link href="/academy">Academy</Link> / {stage.title}</p>
      <h1>{lesson.title}</h1>
      <p className="muted small">{lesson.minutes} min read</p>
      <div className="card prose mt" dangerouslySetInnerHTML={{ __html: renderMarkdown(lesson.body) }} />
      <div className="spread mt">
        <div className="row">
          <Link href={lesson.action.href} className="btn primary">{lesson.action.label}</Link>
          <form action={toggleLesson}>
            <input type="hidden" name="lessonId" value={lesson.id} />
            <input type="hidden" name="done" value={done ? "1" : "0"} />
            <button className="btn">{done ? "Mark as not done" : "Mark complete"}</button>
          </form>
        </div>
        {next && <Link href={`/academy/${next.id}`}>Next: {next.title} →</Link>}
      </div>
    </div>
  );
}
