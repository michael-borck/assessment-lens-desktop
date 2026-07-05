// PROTOTYPE — Variant E: cohort-relative compare. Throwaway.
// Philosophy: a signal means little in isolation. Show this submission beside a
// couple of anonymised peers + the cohort norm, so the lecturer calibrates
// relatively — "is this conclusion short *for this cohort*, or is everyone's?"
// (Cohort-distinctiveness framing — neutral, never plagiarism/collusion.)
import { useState } from "react";
import type { Submission } from "./mock";
import { Topbar } from "./shared";

// Local mock: comparable per-criterion metric across this submission + 2 peers.
const COLS = ["This · Sub 14", "Sub 6 · Group A", "Sub 22 · Group F"];
interface Row {
  crit: string;
  metric: string;
  cohortNorm: string;
  cells: { value: string; note: string; flag?: boolean }[]; // index aligns with COLS
}
const ROWS: Row[] = [
  {
    crit: "Critical engagement",
    metric: "acknowledges method limits",
    cohortNorm: "~70% do",
    cells: [
      { value: "yes", note: "proposes a follow-up RCT" },
      { value: "yes", note: "notes small sample" },
      { value: "no", note: "states findings as fact", flag: true },
    ],
  },
  {
    crit: "Use of sources",
    metric: "references verified",
    cohortNorm: "median 9/10",
    cells: [
      { value: "10/11", note: "1 unconfirmed (lookup failed)" },
      { value: "9/9", note: "all confirmed" },
      { value: "6/12", note: "half unconfirmed", flag: true },
    ],
  },
  {
    crit: "Structure & clarity",
    metric: "conclusion length",
    cohortNorm: "median ~200 words",
    cells: [
      { value: "90 w", note: "much shorter than peers", flag: true },
      { value: "210 w", note: "typical" },
      { value: "180 w", note: "typical" },
    ],
  },
];

export function VariantE({ submission }: { submission: Submission }) {
  const [reveal, setReveal] = useState(false);
  return (
    <>
      <Topbar submission={submission} reveal={reveal} onToggleReveal={() => setReveal((r) => !r)} />
      <div className="ve-wrap">
        <p className="va-banner">
          Each row is a signal seen <strong>relative to the cohort</strong>. Highlighted cells
          stand out from the norm — a prompt to look, never a judgement.
        </p>
        <table className="ve-table">
          <thead>
            <tr>
              <th className="ve-rowhead">Signal · norm</th>
              {COLS.map((c, i) => (
                <th key={c} className={i === 0 ? "ve-this" : ""}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.crit}>
                <td className="ve-rowhead">
                  <strong>{row.crit}</strong>
                  <span className="observation-note">{row.metric} · cohort {row.cohortNorm}</span>
                </td>
                {row.cells.map((cell, i) => (
                  <td key={i} className={`${i === 0 ? "ve-this" : ""} ${cell.flag ? "ve-flag" : ""}`}>
                    <span className="ve-val">{cell.value}</span>
                    <span className="ve-note">{cell.note}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="observation-note" style={{ marginTop: 14 }}>
          Distinctiveness/similarity is shown as neutral context for calibration — not a
          plagiarism or collusion signal. You still mark each submission on its own merits.
        </p>
      </div>
    </>
  );
}
