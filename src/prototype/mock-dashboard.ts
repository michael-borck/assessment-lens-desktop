// PROTOTYPE — mock data for the dashboard + ingestion + signal-mapping screens.
// Throwaway.

// ---- Dashboard: unit → assessments → runs (H) ----
export type RunStatus = "needs-setup" | "preprocessing" | "signals-ready" | "reviewing" | "done";
export interface Run {
  id: string;
  kind: "group" | "individual" | "single";
  mode: string;
  status: RunStatus;
  total: number;
  reviewed: number;
  signals: number; // how many signals were run
}
export interface Assessment {
  id: string;
  name: string;
  weight: string;
  runs: Run[];
  collated: boolean; // group + individual marks combined into a per-student mark?
}
export interface Unit {
  code: string;
  name: string;
  term: string;
  assessments: Assessment[];
}

export const UNIT: Unit = {
  code: "PHIL201",
  name: "Environmental Ethics",
  term: "Semester 1 · 2026",
  assessments: [
    {
      id: "a1",
      name: "Reflective report",
      weight: "30%",
      collated: false,
      runs: [
        { id: "a1r1", kind: "single", mode: "Written essay", status: "reviewing", total: 31, reviewed: 12, signals: 6 },
      ],
    },
    {
      id: "a2",
      name: "Major project",
      weight: "50%",
      collated: false, // group + individual not yet combined
      runs: [
        { id: "a2r1", kind: "group", mode: "Report + video", status: "done", total: 8, reviewed: 8, signals: 7 },
        { id: "a2r2", kind: "individual", mode: "Reflection", status: "reviewing", total: 31, reviewed: 5, signals: 4 },
      ],
    },
    {
      id: "a3",
      name: "AI-dialogue exercise",
      weight: "20%",
      collated: false,
      runs: [
        { id: "a3r1", kind: "single", mode: "AI conversation", status: "needs-setup", total: 0, reviewed: 0, signals: 0 },
      ],
    },
  ],
};

// ---- Ingestion: messy LMS archive → roster mapping (I) ----
export interface IngestRow {
  raw: string; // the awful filename from the export
  student: string; // mapped roster name (or group)
  id: string;
  file: string; // cleaned target
  state: "mapped" | "extracted" | "skipped" | "unmatched";
  note?: string;
}
export const INGEST_SOURCE = "canvas_bulk_PHIL201_a2.zip";
export const INGEST_PREVIEW: IngestRow[] = [
  { raw: "andersonneo_4471_attempt_2026-03-14_report_FINAL(2).docx", student: "Anderson, Neo", id: "2231041", file: "report.docx", state: "mapped" },
  { raw: "grangerh_4490_attempt_2026-03-14_essay.docx", student: "Granger, Hermione", id: "2231090", file: "report.docx", state: "mapped" },
  { raw: "GroupC_submission_combined.zip", student: "Group C (4 members)", id: "—", file: "3 files extracted", state: "extracted", note: "inner .zip unpacked" },
  { raw: "skywalkerl_4502_LATE_attempt_v3.pdf", student: "Skywalker, Luke", id: "2231102", file: "report.pdf", state: "mapped", note: "marked late" },
  { raw: "__MACOSX/._report.docx", student: "—", id: "—", file: "skipped", state: "skipped", note: "OS junk" },
  { raw: "desktop.ini", student: "—", id: "—", file: "skipped", state: "skipped", note: "not a submission" },
  { raw: "unknown_99999_attempt.docx", student: "no roster match", id: "99999", file: "report.docx", state: "unmatched", note: "ID not on roster — review" },
];

// ---- Signal → rubric mapping (J) ----
export interface SignalDef { id: string; name: string; source: string; }
export const SIGNAL_CATALOGUE: SignalDef[] = [
  { id: "crit_thinking", name: "Critical-thinking moves", source: "conversation-analyser" },
  { id: "reflection_depth", name: "Reflection depth", source: "reflection-analyser" },
  { id: "iteration", name: "Iteration depth", source: "conversation-analyser" },
  { id: "ref_verify", name: "Reference verification", source: "cite-sight" },
  { id: "ref_crossref", name: "In-text ↔ bibliography match", source: "cite-sight" },
  { id: "readability_var", name: "Readability variance", source: "document-analyser" },
  { id: "structure", name: "Structure / section balance", source: "document-analyser" },
  { id: "sentiment", name: "Tone / sentiment", source: "document-analyser" },
  { id: "distinctiveness", name: "Cohort distinctiveness", source: "assessment-lens" },
  { id: "prompt_var", name: "Prompt-vocabulary variance", source: "conversation-analyser" },
];
export interface RubricCriterion { id: string; title: string; mapped: string[] }
export const RUBRIC_MAP: RubricCriterion[] = [
  { id: "critical", title: "Critical engagement", mapped: ["crit_thinking", "reflection_depth", "iteration"] },
  { id: "sources", title: "Use of sources", mapped: ["ref_verify", "ref_crossref"] },
  { id: "structure", title: "Structure & clarity", mapped: ["readability_var", "structure"] },
];
