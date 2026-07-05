// Phase 1 — Dashboard: units → assessments → runs. (Validated design: prototype H.)
import { getUnits, type Run, type RunStatus } from "../data";
import { useNav } from "../nav";

const STATUS: Record<RunStatus, string> = {
  "needs-setup": "Needs setup",
  preprocessing: "Preprocessing…",
  "signals-ready": "Signals ready",
  reviewing: "Reviewing",
  done: "Done",
};

export function Dashboard() {
  const { go } = useNav();
  const units = getUnits();

  const openRun = (unitId: string, aId: string, name: string) =>
    go({ screen: "cohort", params: { unitId, aId }, crumb: name });

  return (
    <div className="screen">
      <p className="banner">
        Signals are observations to read <strong>together</strong> — one alone rarely means much.
        You assign every mark.
      </p>

      {units.map((u) => (
        <div className="unit" key={u.id}>
          <div className="unit__head">
            <h2>{u.code} · {u.name}</h2>
            <span className="muted">{u.term}</span>
          </div>

          {u.assessments.map((a) => {
            const group = a.runs.find((r) => r.kind === "group");
            const indiv = a.runs.find((r) => r.kind === "individual");
            const needsCollate = group && indiv && !a.collated;
            return (
              <section className="card assess" key={a.id}>
                <header className="assess__head">
                  <h3>{a.name}</h3>
                  <span className="pill">{a.weight}</span>
                  <span className="spacer" />
                  <button className="btn">Export marks (CSV)</button>
                  <button className="btn">Export marks + signals</button>
                </header>
                {a.runs.map((r: Run) => {
                  const pct = r.total ? Math.round((r.reviewed / r.total) * 100) : 0;
                  return (
                    <div className="run" key={r.id}>
                      <span className={`kind k-${r.kind}`}>{r.kind}</span>
                      <span className="run__mode">{r.mode}</span>
                      <span className={`status s-${r.status}`}>{STATUS[r.status]}</span>
                      {r.status === "needs-setup" ? (
                        <span className="muted run__fill">no submissions ingested yet</span>
                      ) : (
                        <span className="run__fill">
                          <span className="bar"><span style={{ width: `${pct}%` }} /></span>
                          {r.reviewed}/{r.total} reviewed · {r.signals} signals
                        </span>
                      )}
                      <button className="btn" onClick={() => openRun(u.id, a.id, `${a.name} · ${r.kind}`)}>
                        {r.status === "needs-setup" ? "Set up" : "Open"}
                      </button>
                    </div>
                  );
                })}
                {needsCollate && (
                  <div className="collate">
                    Group + individual runs not yet combined ·
                    <button className="btn accent" style={{ marginLeft: 8 }}>Collate into per-student marks</button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ))}
    </div>
  );
}
