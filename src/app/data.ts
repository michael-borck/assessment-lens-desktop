// Phase 1 — data layer. Mock now, shaped like the engine's responses so the
// screens never change when we swap this for the `serve` sidecar calls.

export type RunStatus = "needs-setup" | "preprocessing" | "signals-ready" | "reviewing" | "done";

export interface Run {
  id: string;
  kind: "group" | "individual" | "single";
  mode: string;
  status: RunStatus;
  total: number;
  reviewed: number;
  signals: number;
}
export interface Assessment {
  id: string;
  name: string;
  weight: string;
  collated: boolean;
  runs: Run[];
}
export interface Unit {
  id: string;
  code: string;
  name: string;
  term: string;
  assessments: Assessment[];
}
export interface CohortStudent {
  id: string;
  label: string;
  strength: number[]; // per criterion, 0–100, aligned to COHORT_CRITERIA
  reviewed: boolean;
}

export const COHORT_CRITERIA = ["Critical", "Sources", "Structure"];

const UNITS: Unit[] = [
  {
    id: "phil201",
    code: "PHIL201",
    name: "Environmental Ethics",
    term: "Semester 1 · 2026",
    assessments: [
      { id: "a1", name: "Reflective report", weight: "30%", collated: false, runs: [
        { id: "a1r1", kind: "single", mode: "Written essay", status: "reviewing", total: 31, reviewed: 12, signals: 6 },
      ] },
      { id: "a2", name: "Major project", weight: "50%", collated: false, runs: [
        { id: "a2r1", kind: "group", mode: "Report + video", status: "done", total: 8, reviewed: 8, signals: 7 },
        { id: "a2r2", kind: "individual", mode: "Reflection", status: "reviewing", total: 31, reviewed: 5, signals: 4 },
      ] },
      { id: "a3", name: "AI-dialogue exercise", weight: "20%", collated: false, runs: [
        { id: "a3r1", kind: "single", mode: "AI conversation", status: "needs-setup", total: 0, reviewed: 0, signals: 0 },
      ] },
    ],
  },
  {
    id: "cs140",
    code: "CS140",
    name: "Intro to Programming",
    term: "Semester 1 · 2026",
    assessments: [
      { id: "b1", name: "Portfolio", weight: "40%", collated: false, runs: [
        { id: "b1r1", kind: "single", mode: "Code repository", status: "signals-ready", total: 58, reviewed: 0, signals: 5 },
      ] },
    ],
  },
];

const COHORTS: Record<string, CohortStudent[]> = {
  a1: [
    { id: "s47", label: "Submission 47 · Group H", strength: [20, 18, 30], reviewed: false },
    { id: "s22", label: "Submission 22 · Group F", strength: [90, 28, 35], reviewed: false },
    { id: "s09", label: "Submission 09 · Group B", strength: [35, 30, 88], reviewed: false },
    { id: "s38", label: "Submission 38 · Group E", strength: [55, 88, 25], reviewed: false },
    { id: "s14", label: "Submission 14 · Group C", strength: [85, 85, 42], reviewed: false },
    { id: "s28", label: "Submission 28 · Group D", strength: [62, 40, 58], reviewed: false },
    { id: "s06", label: "Submission 06 · Group A", strength: [70, 72, 68], reviewed: true },
    { id: "s31", label: "Submission 31 · Group D", strength: [60, 58, 64], reviewed: true },
    { id: "s52", label: "Submission 52 · Group H", strength: [48, 52, 50], reviewed: false },
    { id: "s03", label: "Submission 03 · Group A", strength: [88, 90, 86], reviewed: true },
    { id: "s11", label: "Submission 11 · Group B", strength: [92, 85, 90], reviewed: false },
    { id: "s23", label: "Submission 23 · Group F", strength: [33, 38, 30], reviewed: false },
    { id: "s35", label: "Submission 35 · Group E", strength: [60, 55, 62], reviewed: false },
    { id: "s41", label: "Submission 41 · Group G", strength: [85, 88, 82], reviewed: true },
    { id: "s44", label: "Submission 44 · Group G", strength: [50, 52, 48], reviewed: false },
  ],
};

// ---- accessors (swap bodies for sidecar HTTP calls later) ----
export function getUnits(): Unit[] { return UNITS; }
export function getUnit(unitId: string): Unit | undefined { return UNITS.find((u) => u.id === unitId); }
export function getAssessment(unitId: string, aId: string): Assessment | undefined {
  return getUnit(unitId)?.assessments.find((a) => a.id === aId);
}
export function getCohort(aId: string): CohortStudent[] { return COHORTS[aId] ?? COHORTS.a1; }

// ---- per-student shape (the cohort triage classification) ----
export type Pattern = "polarised" | "low" | "high" | "even";
export function classify(s: number[]): Pattern {
  const max = Math.max(...s), min = Math.min(...s);
  if (max - min >= 40) return "polarised";
  if (max <= 40) return "low";
  if (min >= 75) return "high";
  return "even";
}
export const band = (v: number) => (v < 40 ? "low" : v >= 75 ? "high" : "mid");
