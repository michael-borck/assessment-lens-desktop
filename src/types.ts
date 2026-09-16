// Shared contracts. The engine result mirrors assessment-lens's pydantic models
// (serve → GET /assessments/{id}/result); there is deliberately no score/mark in
// it — the lens narrates and cites, the human marks. MarkSheet is the app's own
// local persistence (never sent to the engine).

export interface Evidence {
  signal: string;
  value: unknown;
}

export type Coverage = "present" | "partial" | "absent";

export interface Observation {
  criterion_id: string;
  evidence: Evidence[];
  note: string;
  coverage: Coverage | null;
  coverage_source: string;
}

export interface DeliverableObservation {
  deliverable_id: string;
  status: string; // present | missing | wrong-type
  note: string;
  matched_artefacts: string[];
}

export interface SpaceDistinctiveness {
  space: string;
  nearest_submission_id: string | null;
  nearest_similarity: number | null;
  mean_similarity: number | null;
  stands_apart: boolean;
  notably_similar: boolean;
}

export interface Distinctiveness {
  spaces: SpaceDistinctiveness[];
  note: string;
}

export interface SubmissionResult {
  submission_id: string;
  observations: Observation[];
  deliverables: DeliverableObservation[];
  distinctiveness: Distinctiveness | null;
  error: string; // non-empty when analysis failed for this submission
}

export interface AssessmentResult {
  assignment: string;
  component: string | null;
  submissions: SubmissionResult[];
}

// --- Local mark sheet --------------------------------------------------------
export interface StudentMarks {
  marks: Record<string, number | null>; // criterion id → the human's mark
  strengths: string;
  improvements: string;
  overall: string;
  finalised: boolean;
  updatedAt: string;
}

export interface CriterionMax {
  id: string;
  max: number;
}

export interface MarkSheet {
  version: 1;
  key: string;
  assignment: string;
  criteria: CriterionMax[];
  students: Record<string, StudentMarks>;
}
