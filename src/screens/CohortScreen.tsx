// Cohort — one row per submission, grouped by triage shape (prototype G):
// work the attention groups first, not row-by-row. Errors sit on top with a
// single-submission re-run. Click a row → the student review screen.
import type { CriterionMax } from "../types";
import type { AssessmentResult, MarkSheet, SubmissionResult } from "../types";
import {
  classifyPattern,
  coverageBand,
  criterionCoverages,
  enteredTotal,
  hasDistinctivenessFlag,
  markedCount,
  maxTotal,
  PATTERN_LABEL,
  studentMarks,
  summarise,
  type Pattern,
} from "../marks";

interface Props {
  result: AssessmentResult;
  criteria: CriterionMax[];
  sheet: MarkSheet;
  onOpen: (sid: string) => void;
  onReRun: (sid: string) => void;
  reRunning: string | null;
  onReAssess: () => void;
  onExport: () => void;
  onNewRun: () => void;
}

const PATTERN_ORDER: Pattern[] = ["polarised", "low", "high", "even"];

function Row(p: {
  sub: SubmissionResult;
  criteria: CriterionMax[];
  sheet: MarkSheet;
  onOpen: () => void;
}) {
  const m = studentMarks(p.sheet, p.sub.submission_id);
  const covs = criterionCoverages(p.sub, p.criteria.map((c) => c.id));
  const marked = markedCount(m, p.criteria);
  const total = enteredTotal(m, p.criteria);
  const max = maxTotal(p.criteria);
  const flagged = hasDistinctivenessFlag(p.sub);
  return (
    <button className="srow" onClick={p.onOpen}>
      <span className="srow__name" title={p.sub.submission_id}>
        {p.sub.submission_id}
        {flagged && (
          <span className="diam" title="Stands apart from (or sits unusually close to) the cohort in at least one comparison space — a prompt to look, never a verdict.">
            {"  ◆"}
          </span>
        )}
      </span>
      <span className="rollup">
        {covs.map((c, i) => (
          <span
            key={i}
            className={`rbar b-${coverageBand(c)}`}
            title={`${p.criteria[i]?.id ?? i}: ${c ?? "no observation"}`}
          >
            <span style={{ height: c === null ? "8%" : "100%" }} />
          </span>
        ))}
      </span>
      <span className={`pill pat p-${classifyPattern(p.sub, p.criteria.map((c) => c.id))}`}>
        {PATTERN_LABEL[classifyPattern(p.sub, p.criteria.map((c) => c.id))].label}
      </span>
      <span>
        {p.sub.deliverables.map((d) => (
          <span
            key={d.deliverable_id}
            className={`pill ${d.status === "present" ? "high" : d.status === "missing" ? "low" : "info"}`}
            style={{ marginRight: 4 }}
            title={d.note || d.status}
          >
            {d.status === "present" ? "✓" : "✗"} {d.deliverable_id}
          </span>
        ))}
      </span>
      <span className="srow__marks">
        {marked > 0 ? (
          <>
            <strong>{Number.isInteger(total) ? total : total.toFixed(1)}</strong>/{max}
            {m.finalised && <span className="done"> ✓</span>}
            <br />
          </>
        ) : null}
        {marked}/{p.criteria.length} marked
      </span>
      <span className="chev">›</span>
    </button>
  );
}

export function CohortScreen(p: Props) {
  const critIds = p.criteria.map((c) => c.id);
  const failed = p.result.submissions.filter((s) => s.error);
  const ok = p.result.submissions.filter((s) => !s.error);
  const groups = PATTERN_ORDER.map((pat) => ({
    pat,
    items: ok.filter((s) => classifyPattern(s, critIds) === pat),
  })).filter((g) => g.items.length > 0);

  const finalised = ok.filter((s) => studentMarks(p.sheet, s.submission_id).finalised).length;

  return (
    <div className="screen">
      <div className="cohortbar">
        <h2 style={{ fontSize: 16 }}>
          {p.result.assignment}
          {p.result.component ? ` (${p.result.component})` : ""}
        </h2>
        <span className="muted">{summarise(p.result)}</span>
        <span className="pill">{finalised}/{ok.length} finalised</span>
        <span className="spacer" />
        <button className="btn" onClick={p.onReAssess} title="Re-run the analysis with the same rubric + submissions folder; your marks are kept">
          Re-assess
        </button>
        <button className="btn" onClick={p.onExport}>
          Export marks CSV…
        </button>
        <button className="btn" onClick={p.onNewRun}>
          New run
        </button>
      </div>
      <p className="banner">
        Observations, not grades — cited evidence for you to weigh. ◆ = stands out from the cohort
        in some space (a prompt to look, never a verdict).
      </p>

      {failed.length > 0 && (
        <section className="grp">
          <header>
            <strong>Failed analysis</strong>
            <span className="grp__note">re-run once the folder is fixed — one bad file never blocks the cohort</span>
            <span className="grp__n">{failed.length}</span>
          </header>
          {failed.map((s) => (
            <div className="srow" key={s.submission_id} style={{ cursor: "default" }}>
              <span className="srow__name">{s.submission_id}</span>
              <span className="pill bad">error</span>
              <span className="muted" style={{ gridColumn: "span 3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.error}
              </span>
              {p.reRunning === s.submission_id ? (
                <span className="muted">re-running…</span>
              ) : (
                <button className="btn small" onClick={() => p.onReRun(s.submission_id)}>
                  Re-run
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      {groups.map((g) => (
        <section className="grp" key={g.pat}>
          <header>
            <strong>{PATTERN_LABEL[g.pat].label}</strong>
            <span className="grp__note">{PATTERN_LABEL[g.pat].note}</span>
            <span className="grp__n">{g.items.length}</span>
          </header>
          {g.items.map((s) => (
            <Row
              key={s.submission_id}
              sub={s}
              criteria={p.criteria}
              sheet={p.sheet}
              onOpen={() => p.onOpen(s.submission_id)}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
