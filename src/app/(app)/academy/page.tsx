import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { CURRICULUM } from "@/lib/curriculum";

export const metadata = { title: "Academy" };

export default async function Academy() {
  const user = await requireUser();
  const done = new Set((await all<{ lesson_id: string }>("SELECT lesson_id FROM lesson_progress WHERE user_id = ?", user.id)).map((r) => r.lesson_id));
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Academy</h1>
          <p>Four stages, short lessons. Every lesson ends with a button that takes you to the tool where you do that step.</p>
        </div>
      </div>
      <div className="grid grid-2">
        {CURRICULUM.map((stage) => {
          const n = stage.lessons.filter((l) => done.has(l.id)).length;
          return (
            <div key={stage.key} className="card">
              <div className="spread"><h2 style={{ margin: 0 }}>{stage.title}</h2><span className="muted small">{n}/{stage.lessons.length}</span></div>
              <p className="muted small">{stage.summary}</p>
              <div className="lesson-list">
                {stage.lessons.map((l) => (
                  <Link key={l.id} href={`/academy/${l.id}`}>
                    <span className="row"><span className={`check${done.has(l.id) ? " done" : ""}`} /> {l.title}</span>
                    <span className="muted small">{l.minutes} min</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
