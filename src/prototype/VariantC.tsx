// PROTOTYPE — Variant C: triage queue (one signal at a time). Throwaway.
// Philosophy: minimise cognitive load — decide on one observation at a time with
// big, deliberate actions, then a final tally + mark step. Calibration-first.
import { useState } from "react";
import type { Stance, Submission } from "./mock";
import { Topbar, openOriginal } from "./shared";

export function VariantC({ submission }: { submission: Submission }) {
  const [reveal, setReveal] = useState(false);
  const flat = submission.criteria.flatMap((c) => c.signals.map((s) => ({ ...s, crit: c.title })));
  const [i, setI] = useState(0);
  const [stances, setStances] = useState<Record<string, Stance>>({});
  const [marks, setMarks] = useState<Record<string, string>>({});

  const decide = (s: Stance) => {
    setStances((prev) => ({ ...prev, [flat[i].id]: s }));
    setI((n) => n + 1);
  };

  const done = i >= flat.length;
  const pct = Math.round((Math.min(i, flat.length) / flat.length) * 100);

  return (
    <>
      <Topbar submission={submission} reveal={reveal} onToggleReveal={() => setReveal((r) => !r)} />
      <div className="vc-stage">
        <div className="vc-progress">
          <span className="count">{done ? "All signals reviewed" : `Signal ${i + 1} of ${flat.length}`}</span>
          <span className="bar"><span style={{ width: `${pct}%` }} /></span>
          <span className="count">{Object.keys(stances).length} calibrated</span>
        </div>

        {!done ? (
          <div className="vc-card">
            <div className="crit-tag">{flat[i].crit}</div>
            <div className="obs">{flat[i].observation}</div>
            <blockquote className="evidence">
              “{flat[i].evidence[0].quote}”<span className="loc">{flat[i].evidence[0].locator}</span>
            </blockquote>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <span className="source-tag">{flat[i].source}</span>
              <button className="btn btn-open" onClick={() => openOriginal(submission.files[0].name)}>
                open original to check
              </button>
            </div>
            <div className="vc-actions">
              <button className="a-disagree" onClick={() => decide("disagree")}>Disagree</button>
              <button className="a-adjust" onClick={() => decide("adjust")}>Adjust</button>
              <button className="a-agree" onClick={() => decide("agree")}>Agree</button>
            </div>
            <p className="observation-note" style={{ marginTop: 14, textAlign: "center" }}>
              An observation, not a verdict. Your call is recorded for calibration.
            </p>
          </div>
        ) : (
          <div className="vc-card vc-done">
            <h2>Your read on {submission.label}</h2>
            <p className="observation-note">You calibrated every signal. Now set the marks — the tool never does.</p>
            <ul className="vc-tally">
              {flat.map((s) => (
                <li key={s.id}>
                  <strong style={{ textTransform: "capitalize" }}>{stances[s.id] ?? "—"}</strong> · {s.observation.slice(0, 64)}…
                </li>
              ))}
            </ul>
            {submission.criteria.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0" }}>
                <span style={{ flex: 1, textAlign: "left" }}>{c.title}</span>
                {reveal && <span className="estimate-veil">est <span className="num">{c.estimate}</span></span>}
                <input
                  className="mark-input"
                  placeholder="—"
                  value={marks[c.id] ?? ""}
                  onChange={(e) => setMarks({ ...marks, [c.id]: e.target.value })}
                />
                <span style={{ color: "var(--muted)" }}>/{c.maxMark}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="btn" onClick={() => setI(0)}>Re-review</button>
              <button className="btn btn-accent" onClick={() => alert("Prototype: would save this marking session + calibration.")}>
                Save marking session
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
