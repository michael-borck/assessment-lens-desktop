// PROTOTYPE — Variant I: LMS ingestion / preprocessing. Throwaway.
// The desktop's value-add over the Python package: take a messy LMS bulk export,
// unpack nested zips, drop OS junk, strip the mangled filenames, and MAP each file
// to the roster — then hand a clean folder to the engine. Blind-grading optional.
import { useState } from "react";
import type { Submission } from "./mock";
import { INGEST_PREVIEW, INGEST_SOURCE } from "./mock-dashboard";

const STATE_LABEL: Record<string, string> = {
  mapped: "mapped",
  extracted: "unpacked",
  skipped: "skipped",
  unmatched: "review",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function VariantI(_props: { submission: Submission }) {
  const [lms, setLms] = useState("canvas");
  const [flatten, setFlatten] = useState(true);
  const [extract, setExtract] = useState(true);
  const [blind, setBlind] = useState(false);

  const counts = INGEST_PREVIEW.reduce(
    (a, r) => ({ ...a, [r.state]: (a[r.state] ?? 0) + 1 }),
    {} as Record<string, number>,
  );

  return (
    <div className="vi-wrap">
      <div className="rv-topbar">
        <span className="crumb">PHIL201 · Major project ‹</span>
        <h1>New run · ingest submissions</h1>
        <span className="spacer" />
        <button className="btn btn-accent" disabled={counts.unmatched > 0}>
          {counts.unmatched ? `Resolve ${counts.unmatched} unmatched first` : "Continue → map signals"}
        </button>
      </div>

      <div className="vi-body">
        <div className="vi-config">
          <label className="vi-field">
            <span>Submissions archive</span>
            <span className="vi-file">{INGEST_SOURCE} <button className="btn">Browse…</button></span>
          </label>

          <label className="vi-field"><span>LMS export format</span>
            <select value={lms} onChange={(e) => setLms(e.target.value)}>
              <option value="canvas">Canvas bulk export</option>
              <option value="blackboard">Blackboard assignment file</option>
              <option value="moodle">Moodle directory</option>
              <option value="raw">Raw / unstructured folder</option>
            </select>
          </label>

          <label className="vi-check"><input type="checkbox" checked={flatten} onChange={(e) => setFlatten(e.target.checked)} /> Flatten subfolders</label>
          <label className="vi-check"><input type="checkbox" checked={extract} onChange={(e) => setExtract(e.target.checked)} /> Extract inner .zip submissions</label>
          <label className="vi-check"><input type="checkbox" checked={blind} onChange={(e) => setBlind(e.target.checked)} /> Blind grading (anonymise names)</label>

          <p className="observation-note">
            The roster maps {lms === "canvas" ? "Canvas" : lms === "blackboard" ? "Blackboard" : lms} IDs back to
            students. The signal engine never sees the original filenames — it just gets a clean folder.
          </p>
        </div>

        <div className="vi-preview">
          <div className="vi-preview__head">
            <strong>Mapping preview</strong>
            <span className="observation-note">
              {counts.mapped ?? 0} mapped · {counts.extracted ?? 0} unpacked · {counts.skipped ?? 0} skipped ·
              {" "}{counts.unmatched ?? 0} need review
            </span>
          </div>
          <table className="vi-table">
            <thead><tr><th>In the export</th><th>→ Student</th><th>→ File</th></tr></thead>
            <tbody>
              {INGEST_PREVIEW.map((r, i) => (
                <tr key={i} className={`vi-row vi-${r.state}`}>
                  <td className="vi-raw">{blind && r.state === "mapped" ? r.raw.replace(/^[a-z]+/i, "•••") : r.raw}</td>
                  <td>
                    {blind && (r.state === "mapped" || r.state === "extracted") ? `Student ${r.id}` : r.student}
                    <span className={`vi-tag t-${r.state}`}>{STATE_LABEL[r.state]}</span>
                  </td>
                  <td>{r.file}{r.note && <span className="observation-note"> · {r.note}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
