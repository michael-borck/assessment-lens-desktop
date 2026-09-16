// Marking helpers: run keys, the cohort triage shape (prototype G), totals, and
// spreadsheet-safe CSV export. Marks are the human's — nothing here derives one.
import type {
  AssessmentResult,
  Coverage,
  CriterionMax,
  MarkSheet,
  StudentMarks,
  SubmissionResult,
} from "./types";

export function runKey(rubricPath: string, submissionsPath: string): string {
  // djb2 over both paths — stable across restarts; local sheets only.
  let h = 5381;
  for (const ch of `${rubricPath}|${submissionsPath}`) {
    h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export function emptyStudent(criteria: CriterionMax[]): StudentMarks {
  const marks: Record<string, number | null> = {};
  for (const c of criteria) marks[c.id] = null;
  return {
    marks,
    strengths: "",
    improvements: "",
    overall: "",
    finalised: false,
    updatedAt: new Date().toISOString(),
  };
}

/** Fill missing/stale criterion keys without clobbering saved marks. */
export function reconcileSheet(sheet: MarkSheet, criteria: CriterionMax[]): MarkSheet {
  const students: MarkSheet["students"] = {};
  for (const [sid, m] of Object.entries(sheet.students)) {
    const marks: Record<string, number | null> = {};
    for (const c of criteria) marks[c.id] = m.marks?.[c.id] ?? null;
    students[sid] = { ...m, marks };
  }
  return { ...sheet, criteria, students };
}

export function studentMarks(sheet: MarkSheet, sid: string): StudentMarks {
  return (
    sheet.students[sid] ?? {
      marks: Object.fromEntries(sheet.criteria.map((c) => [c.id, null])),
      strengths: "",
      improvements: "",
      overall: "",
      finalised: false,
      updatedAt: new Date().toISOString(),
    }
  );
}

// --- Cohort triage (coverage → shape, never a mark) ---------------------------
export type Band = "low" | "mid" | "high" | "none";

export function coverageBand(c: Coverage | null): Band {
  if (c === "present") return "high";
  if (c === "partial") return "mid";
  if (c === "absent") return "low";
  return "none";
}

const BAND_VALUE: Record<Band, number> = { low: 15, mid: 55, high: 90, none: 55 };

export function criterionCoverages(sub: SubmissionResult, criteriaIds: string[]): (Coverage | null)[] {
  const byCrit = new Map(sub.observations.map((o) => [o.criterion_id, o.coverage]));
  return criteriaIds.map((id) => byCrit.get(id) ?? null);
}

export type Pattern = "polarised" | "low" | "high" | "even";

export const PATTERN_LABEL: Record<Pattern, { label: string; note: string }> = {
  polarised: { label: "Polarised", note: "strong on some criteria, weak on others — worth understanding" },
  low: { label: "Consistently low", note: "thin across the rubric — confirm it's really low" },
  high: { label: "Consistently high", note: "strong across the rubric — confirm it's really that good" },
  even: { label: "Even", note: "consistent mid-range — likely the bulk" },
};

export function classifyPattern(sub: SubmissionResult, criteriaIds: string[]): Pattern {
  const vals = criterionCoverages(sub, criteriaIds).map((c) => BAND_VALUE[coverageBand(c)]);
  if (!vals.length) return "even";
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  if (max - min >= 40) return "polarised";
  if (max <= 40) return "low";
  if (min >= 75) return "high";
  return "even";
}

export function hasDistinctivenessFlag(sub: SubmissionResult): boolean {
  return (
    sub.distinctiveness?.spaces.some((s) => s.stands_apart || s.notably_similar) ?? false
  );
}

// --- Totals (entered marks only) ---------------------------------------------
export function enteredTotal(m: StudentMarks, criteria: CriterionMax[]): number {
  const ids = new Set(criteria.map((c) => c.id));
  return Object.entries(m.marks).reduce<number>(
    (a, [id, v]) => (ids.has(id) && typeof v === "number" ? a + v : a),
    0,
  );
}

export function maxTotal(criteria: CriterionMax[]): number {
  return criteria.reduce((a, c) => a + c.max, 0);
}

export function markedCount(m: StudentMarks, criteria: CriterionMax[]): number {
  return criteria.filter((c) => typeof m.marks[c.id] === "number").length;
}

// --- CSV export (spreadsheet-injection-safe, mirroring the engine) ------------
function csvField(v: unknown): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildMarksCsv(sheet: MarkSheet, subs: SubmissionResult[]): string {
  const critIds = sheet.criteria.map((c) => c.id);
  const header = [
    "submission_id",
    "total",
    ...critIds,
    "marked",
    "finalised",
    "strengths",
    "improvements",
    "overall",
  ];
  const lines = subs.map((s) => {
    const m = studentMarks(sheet, s.submission_id);
    return [
      s.submission_id,
      String(enteredTotal(m, sheet.criteria)),
      ...critIds.map((id) => {
        const v = m.marks[id];
        return typeof v === "number" ? String(v) : "";
      }),
      `${markedCount(m, sheet.criteria)}/${critIds.length}`,
      m.finalised ? "yes" : "",
      m.strengths,
      m.improvements,
      m.overall,
    ]
      .map(csvField)
      .join(",");
  });
  return `${[header.join(","), ...lines].join("\r\n")}\r\n`;
}

export function summarise(result: AssessmentResult): string {
  const n = result.submissions.length;
  const bad = result.submissions.filter((s) => s.error).length;
  return bad ? `${n} submissions (${bad} failed analysis)` : `${n} submissions`;
}
