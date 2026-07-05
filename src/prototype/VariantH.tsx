// PROTOTYPE — Variant H: unit dashboard. Throwaway.
// The home screen: a unit's assessments and their runs. An assessment may have a
// group run AND an individual run (each a separate signals pass over a folder);
// the marks are collated per student afterwards. Export marks ± signals to CSV.
import type { Submission } from "./mock";
import type { Run, RunStatus } from "./mock-dashboard";
import { UNIT } from "./mock-dashboard";

const STATUS: Record<RunStatus, { label: string; cls: string }> = {
  "needs-setup": { label: "Needs setup", cls: "s-setup" },
  preprocessing: { label: "Preprocessing…", cls: "s-proc" },
  "signals-ready": { label: "Signals ready", cls: "s-ready" },
  reviewing: { label: "Reviewing", cls: "s-review" },
  done: { label: "Done", cls: "s-done" },
};

function RunLine({ run }: { run: Run }) {
  const pct = run.total ? Math.round((run.reviewed / run.total) * 100) : 0;
  return (
    <div className="vh-run">
      <span className={`vh-kind k-${run.kind}`}>{run.kind}</span>
      <span className="vh-run__mode">{run.mode}</span>
      <span className={`vh-status ${STATUS[run.status].cls}`}>{STATUS[run.status].label}</span>
      {run.status === "needs-setup" ? (
        <span className="observation-note" style={{ flex: 1 }}>no submissions ingested yet</span>
      ) : (
        <span className="vh-run__prog">
          <span className="bar"><span style={{ width: `${pct}%` }} /></span>
          {run.reviewed}/{run.total} reviewed · {run.signals} signals
        </span>
      )}
      <button className="btn">{run.status === "needs-setup" ? "Set up" : "Open"}</button>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function VariantH(_props: { submission: Submission }) {
  return (
    <div className="vh-wrap">
      <div className="rv-topbar">
        <h1>{UNIT.code} · {UNIT.name}</h1>
        <span className="crumb">{UNIT.term}</span>
        <span className="spacer" />
        <button className="btn btn-accent">+ New assessment run</button>
      </div>

      <div className="vh-body">
        <p className="va-banner">
          Signals are observations to read <strong>together</strong> — one alone rarely means much;
          it's a distinctive combination that earns a closer look. You assign every mark.
        </p>

        {UNIT.assessments.map((a) => {
          const group = a.runs.find((r) => r.kind === "group");
          const indiv = a.runs.find((r) => r.kind === "individual");
          const needsCollate = group && indiv && !a.collated;
          return (
            <section className="vh-assess" key={a.id}>
              <header>
                <h3>{a.name}</h3>
                <span className="vh-weight">{a.weight}</span>
                <span className="spacer" />
                <button className="btn">Export marks (CSV)</button>
                <button className="btn">Export marks + signals</button>
              </header>
              {a.runs.map((r) => <RunLine key={r.id} run={r} />)}
              {needsCollate && (
                <div className="vh-collate">
                  Group + individual runs not yet combined ·
                  <button className="btn btn-accent" style={{ marginLeft: 8 }}>Collate into per-student marks</button>
                  <span className="observation-note" style={{ marginLeft: 8 }}>
                    (adds each group's mark to its members, then merges with their individual mark)
                  </span>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
