/** Render an AssessmentResult — observations, deliverables, distinctiveness.
 *  No marks: the lens narrates and cites; the human marks. */

interface Evidence {
  signal: string;
  value: unknown;
}
interface Observation {
  criterion_id: string;
  coverage: string | null;
  note: string;
  evidence: Evidence[];
}
interface Deliverable {
  deliverable_id: string;
  status: string;
  note: string;
}
interface SpaceDist {
  space: string;
  nearest_submission_id: string | null;
  nearest_similarity: number | null;
  mean_similarity: number | null;
  stands_apart: boolean;
  notably_similar: boolean;
}
interface Submission {
  submission_id: string;
  observations: Observation[];
  deliverables: Deliverable[];
  distinctiveness: { spaces: SpaceDist[]; note: string } | null;
}
export interface AssessmentResult {
  assignment: string;
  component: string | null;
  submissions: Submission[];
}

const COVERAGE_COLOR: Record<string, string> = {
  present: "#2e7d32",
  partial: "#b8860b",
  absent: "#c62828",
};

export function CohortResults({ result }: { result: AssessmentResult }) {
  return (
    <div>
      <h2 style={{ fontSize: 16 }}>
        {result.assignment}
        {result.component ? ` (${result.component})` : ""} — {result.submissions.length} submissions
      </h2>
      <p style={{ color: "#777", fontSize: 13, marginTop: -6 }}>
        Observations, not grades — cited evidence for you to weigh. You assign every mark.
      </p>
      {result.submissions.map((s) => (
        <div
          key={s.submission_id}
          style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 14, marginBottom: 12 }}
        >
          <strong>{s.submission_id}</strong>
          <div style={{ fontSize: 13, marginTop: 6 }}>
            {s.deliverables.map((d) => (
              <span key={d.deliverable_id} style={{ marginRight: 12 }}>
                {d.status === "present" ? "✓" : "✗"} {d.deliverable_id}
              </span>
            ))}
          </div>
          <table style={{ width: "100%", fontSize: 13, marginTop: 8, borderCollapse: "collapse" }}>
            <tbody>
              {s.observations.map((o) => (
                <tr key={o.criterion_id} style={{ borderTop: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "4px 8px", fontWeight: 500 }}>{o.criterion_id}</td>
                  <td style={{ padding: "4px 8px", color: COVERAGE_COLOR[o.coverage ?? ""] ?? "#777" }}>
                    {o.coverage ?? "—"}
                  </td>
                  <td style={{ padding: "4px 8px", color: "#555" }}>
                    {o.evidence.map((e) => `${e.signal}=${String(e.value)}`).join("; ")}
                    {o.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {s.distinctiveness?.note && (
            <p style={{ fontSize: 12, color: "#555", marginTop: 8, fontStyle: "italic" }}>
              Cohort: {s.distinctiveness.note}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
