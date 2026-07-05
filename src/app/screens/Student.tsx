// Phase 1 — Student review (STUB for this slice). Next slice ports the validated
// rubric × signal table + overlays (prototype D/B) and feedback/estimate.
import { useNav } from "../nav";

export function Student({ params }: { params?: Record<string, string> }) {
  const { route } = useNav();
  return (
    <div className="screen">
      <div className="card" style={{ padding: 24 }}>
        <h2>{route.crumb ?? "Student"}</h2>
        <p className="muted" style={{ marginTop: 8 }}>
          Individual review screen — coming in the next slice: rubric × signal table with
          colour-coded pills, click-through overlays (signal · criterion · mark · feedback),
          three one-sentence feedback comments, and the hidden-by-default estimate.
        </p>
        <p className="muted" style={{ marginTop: 8 }}>
          (Student id: {params?.sid ?? "—"})
        </p>
      </div>
    </div>
  );
}
