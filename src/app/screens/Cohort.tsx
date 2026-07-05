// Phase 1 — Cohort: row-per-student, per-criterion strength rollup, grouped by
// shape (polarised / consistently-low / consistently-high / even). (Validated:
// prototype G.) Click a student → the individual review screen.
import { getCohort, classify, band, COHORT_CRITERIA, type Pattern } from "../data";
import { useNav } from "../nav";

const PATTERN: Record<Pattern, { label: string; note: string }> = {
  polarised: { label: "Polarised", note: "strong on some criteria, weak on others — worth understanding" },
  low: { label: "Consistently low", note: "weak across the rubric — confirm it's really low" },
  high: { label: "Consistently high", note: "strong across the rubric — confirm it's really that good" },
  even: { label: "Even", note: "consistent mid-range — likely the bulk, low priority" },
};
const ORDER: Pattern[] = ["polarised", "low", "high", "even"];

export function Cohort({ params }: { params?: Record<string, string> }) {
  const { go } = useNav();
  const aId = params?.aId ?? "a1";
  const rows = getCohort(aId).map((r) => ({ ...r, pat: classify(r.strength) }));

  return (
    <div className="screen">
      <div className="legend">
        <span className="legend__crit">{COHORT_CRITERIA.join(" · ")}</span>
        <span className="legend__key"><i className="b-low" /> low <i className="b-mid" /> mid <i className="b-high" /> high</span>
        <span className="muted" style={{ marginLeft: "auto" }}>
          {ORDER.filter((p) => p !== "even").map((p) => `${rows.filter((r) => r.pat === p).length} ${p}`).join(" · ")} — the rest are even
        </span>
      </div>

      {ORDER.map((p) => {
        const items = rows.filter((r) => r.pat === p);
        if (!items.length) return null;
        return (
          <section className="grp" data-pat={p} key={p}>
            <header><strong>{PATTERN[p].label}</strong> <span className="muted">{PATTERN[p].note}</span> <span className="grp__n">{items.length}</span></header>
            {items.map((r) => (
              <button className="srow" key={r.id} onClick={() => go({ screen: "student", params: { aId, sid: r.id }, crumb: r.label })}>
                <span className="srow__name">{r.label}</span>
                <span className="rollup">
                  {r.strength.map((v, i) => (
                    <span key={i} className={`rbar b-${band(v)}`} title={`${COHORT_CRITERIA[i]} ${v}`}>
                      <span style={{ height: `${v}%` }} />
                    </span>
                  ))}
                </span>
                <span className={`pat p-${r.pat}`}>{PATTERN[r.pat].label}</span>
                <span className="srow__status muted">{r.reviewed ? "✓ reviewed" : "—"}</span>
                <span className="chev">›</span>
              </button>
            ))}
          </section>
        );
      })}
    </div>
  );
}
