// Student review — the human-in-the-loop moment (prototype G/D): per-criterion
// observations with cited evidence beside a mark field the human owns, three
// feedback comments, cohort-relative context, "open original" via the OS.
import type { CriterionMax, MarkSheet, StudentMarks, SubmissionResult } from "../types";
import type { RubricInfo } from "../../global";
import {
  coverageBand,
  enteredTotal,
  markedCount,
  maxTotal,
  studentMarks,
} from "../marks";

interface Props {
  sub: SubmissionResult;
  rubric: RubricInfo;
  criteria: CriterionMax[];
  sheet: MarkSheet;
  onChange: (m: StudentMarks) => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  position: string;
  submissionsPath: string;
}

const COVERAGE_NOTE: Record<string, string> = {
  present: "evidence present",
  partial: "partial evidence",
  absent: "no evidence found",
};

export function StudentScreen(p: Props) {
  const sub = p.sub;
  const m = studentMarks(p.sheet, sub.submission_id);
  const desc = new Map(p.rubric.criteria.map((c) => [c.id, c.description]));
  const total = enteredTotal(m, p.criteria);
  const max = maxTotal(p.criteria);

  const set = (patch: Partial<StudentMarks>) => {
    const next = { ...studentMarks(p.sheet, sub.submission_id), ...patch, updatedAt: new Date().toISOString() };
    p.onChange(next);
  };
  const setMark = (id: string, raw: string) => {
    const v = raw === "" ? null : Math.max(0, Math.min(p.criteria.find((c) => c.id === id)?.max ?? 1e9, Number(raw)));
    set({ marks: { ...m.marks, [id]: v == null || Number.isNaN(v) ? null : v } });
  };

  const dist = sub.distinctiveness;
  const flagged = dist?.spaces.filter((s) => s.stands_apart || s.notably_similar) ?? [];

  return (
    <div className="screen">
      <div className="studhead">
        <button className="btn small" onClick={p.onClose}>
          ← Cohort
        </button>
        <h2>{sub.submission_id}</h2>
        <span className="muted">{p.position}</span>
        <span className="spacer" />
        <div className="studnav">
          <button className="btn small" onClick={p.onPrev}>
            ← Prev
          </button>
          <button className="btn small" onClick={p.onNext}>
            Next →
          </button>
        </div>
        <button className="btn small" onClick={() => void window.lens.openPath(`${p.submissionsPath}/${sub.submission_id}`)}>
          Open original ↗
        </button>
      </div>

      {sub.deliverables.length > 0 && (
        <div className="deliv">
          {sub.deliverables.map((d) => (
            <span
              key={d.deliverable_id}
              className={`pill ${d.status === "present" ? "high" : d.status === "missing" ? "low" : "info"}`}
              title={d.matched_artefacts.join(", ") || d.status}
            >
              {d.status === "present" ? "✓" : "✗"} {d.deliverable_id}
              {d.status !== "present" && d.note ? ` — ${d.note}` : ""}
            </span>
          ))}
        </div>
      )}

      {flagged.length > 0 && (
        <div className="distnote">
          Cohort context (neutral, never a verdict):{" "}
          {flagged
            .map((s) =>
              s.notably_similar
                ? `unusually close to ${s.nearest_submission_id ?? "a peer"} (${s.space} space)`
                : `stands apart (${s.space} space)`,
            )
            .join("; ")}
          . Read the criteria below to see why.
        </div>
      )}

      {sub.error ? (
        <div className="errorbox">
          Analysis failed for this submission: {sub.error} — go back to the cohort and re-run it
          once the folder is fixed.
        </div>
      ) : (
        sub.observations.map((o) => {
          const critMax = p.criteria.find((c) => c.id === o.criterion_id)?.max;
          return (
            <div className="card critcard" key={o.criterion_id}>
              <div className="critcard__head">
                <h3>{o.criterion_id}</h3>
                <span className={`pill ${coverageBand(o.coverage)}`}>
                  {o.coverage ? COVERAGE_NOTE[o.coverage] : "no observation"}
                  {o.coverage_source === "suggested" ? " (suggested)" : ""}
                </span>
              </div>
              {desc.get(o.criterion_id) && <div className="critcard__desc">{desc.get(o.criterion_id)}</div>}
              <div className="critcard__body">
                <div>
                  {o.evidence.length > 0 && (
                    <ul className="evidence">
                      {o.evidence.map((e, i) => (
                        <li key={i}>
                          <span className="sig">{e.signal}</span>
                          <span className="val">{typeof e.value === "object" ? JSON.stringify(e.value) : String(e.value)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="note">{o.note}</p>
                </div>
                <div className="markbox">
                  <label htmlFor={`mark-${o.criterion_id}`}>Your mark{critMax != null ? ` / ${critMax}` : ""}</label>
                  <input
                    id={`mark-${o.criterion_id}`}
                    type="number"
                    min={0}
                    max={critMax}
                    step={0.5}
                    value={m.marks[o.criterion_id] ?? ""}
                    placeholder="—"
                    onChange={(e) => setMark(o.criterion_id, e.target.value)}
                  />
                </div>
              </div>
            </div>
          );
        })
      )}

      {!sub.error && (
        <div className="card comments">
          <div className="field">
            <label htmlFor="c-strengths">Strengths</label>
            <textarea
              id="c-strengths"
              value={m.strengths}
              onChange={(e) => set({ strengths: e.target.value })}
              placeholder="One sentence, grounded in the observations above…"
            />
          </div>
          <div className="field">
            <label htmlFor="c-improvements">Improvements (as a learning opportunity)</label>
            <textarea
              id="c-improvements"
              value={m.improvements}
              onChange={(e) => set({ improvements: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="c-overall">Overall</label>
            <textarea id="c-overall" value={m.overall} onChange={(e) => set({ overall: e.target.value })} />
          </div>
        </div>
      )}

      <div className="studfoot">
        <span className="total">
          <strong>{Number.isInteger(total) ? total : total.toFixed(1)}</strong>
          <span className="muted"> / {max} entered · {markedCount(m, p.criteria)}/{p.criteria.length} criteria marked</span>
        </span>
        <span className="spacer" />
        <label className="check">
          <input type="checkbox" checked={m.finalised} onChange={(e) => set({ finalised: e.target.checked })} />
          Finalised
        </label>
        <button className="btn" onClick={p.onNext}>
          Next student →
        </button>
      </div>
    </div>
  );
}
