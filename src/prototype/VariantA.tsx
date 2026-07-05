// PROTOTYPE — Variant A: rubric ledger (criterion-first). Throwaway.
// Philosophy: the rubric is the spine. Work down each criterion, calibrate its
// signals, set a per-criterion mark. Estimate hidden until revealed.
import { useState } from "react";
import type { Stance, Submission } from "./mock";
import { StanceButtons, Topbar } from "./shared";

export function VariantA({ submission }: { submission: Submission }) {
  const [reveal, setReveal] = useState(false);
  const [stances, setStances] = useState<Record<string, Stance>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [marks, setMarks] = useState<Record<string, string>>({});

  return (
    <>
      <Topbar submission={submission} reveal={reveal} onToggleReveal={() => setReveal((r) => !r)} />
      <div className="va-wrap">
        <p className="va-banner">
          Signals below are <strong>observations, not grades</strong>. Confirm or
          challenge each against the submission, then you set every mark. Your calibration is saved.
        </p>

        {submission.criteria.map((c) => (
          <section className="va-crit" key={c.id}>
            <div className="va-crit__head">
              <div>
                <h3>{c.title}</h3>
                <p>{c.descriptor}</p>
              </div>
              <div className="va-crit__mark">
                {reveal ? (
                  <span className="estimate-veil">
                    estimate <span className="num">{c.estimate}/{c.maxMark}</span>
                  </span>
                ) : (
                  <span className="estimate-veil">estimate hidden</span>
                )}
                <div style={{ marginTop: 8 }}>
                  <input
                    className="mark-input"
                    placeholder="—"
                    value={marks[c.id] ?? ""}
                    onChange={(e) => setMarks({ ...marks, [c.id]: e.target.value })}
                  />
                  <span style={{ color: "var(--muted)", fontSize: 13 }}> /{c.maxMark}</span>
                </div>
              </div>
            </div>

            {c.signals.map((s) => (
              <div className="va-signal" key={s.id}>
                <div className="va-signal__obs">{s.observation}</div>
                <div className="va-signal__row">
                  {s.evidence.map((e, i) => (
                    <blockquote className="evidence" key={i}>
                      “{e.quote}”<span className="loc">{e.locator}</span>
                    </blockquote>
                  ))}
                </div>
                <div className="va-signal__controls">
                  <span className="source-tag">{s.source}</span>
                  <StanceButtons
                    value={stances[s.id] ?? "unset"}
                    onChange={(v) => setStances({ ...stances, [s.id]: v })}
                  />
                  {(stances[s.id] === "disagree" || stances[s.id] === "adjust") && (
                    <span className="saved-flag">✓ saved</span>
                  )}
                </div>
                {(stances[s.id] === "disagree" || stances[s.id] === "adjust") && (
                  <textarea
                    className="note-input"
                    placeholder="Why? (a line for your own record / calibration)"
                    value={notes[s.id] ?? ""}
                    onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
