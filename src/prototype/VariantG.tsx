// PROTOTYPE — Variant G: cohort overview → drill into the individual view. Throwaway.
// Combines D + E. The cohort is a row-per-student list with a COARSE PER-CRITERION
// STRENGTH ROLLUP, grouped by SHAPE: polarised / consistently-low / consistently-
// high / even. You triage by shape (the interesting shapes float up), then click a
// student to drop into the individual attention view (D), where flagged signals
// also carry the cohort-relative context (E). Back returns to the cohort.
import { useState } from "react";
import type { Stance, Submission } from "./mock";
import { COHORT, COHORT_CRITERIA, COHORT_TOTAL, COHORT_CONTEXT } from "./mock";
import { StanceButtons, openOriginal } from "./shared";

// ---- per-student shape ----
type Pattern = "polarised" | "low" | "high" | "even";
function classify(s: number[]): Pattern {
  const max = Math.max(...s), min = Math.min(...s);
  if (max - min >= 40) return "polarised";
  if (max <= 40) return "low";
  if (min >= 75) return "high";
  return "even";
}
const PATTERN: Record<Pattern, { label: string; note: string }> = {
  polarised: { label: "Polarised", note: "strong on some criteria, weak on others — worth understanding" },
  low: { label: "Consistently low", note: "weak across the rubric — confirm it's really low" },
  high: { label: "Consistently high", note: "strong across the rubric — confirm it's really that good" },
  even: { label: "Even", note: "consistent mid-range — likely the bulk, low priority" },
};
const ORDER: Pattern[] = ["polarised", "low", "high", "even"];
const band = (v: number) => (v < 40 ? "low" : v >= 75 ? "high" : "mid");

// ---- individual attention view (unchanged D-style) ----
const ATTENTION: Record<string, "high" | "medium" | "low"> = { s1: "high", t1: "medium" };
const GROUP: Record<string, string> = { high: "Needs your attention", medium: "Worth a look", low: "Looks consistent" };

export function VariantG({ submission }: { submission: Submission }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [sort, setSort] = useState<"pattern" | "name" | "reviewed">("pattern");
  const [query, setQuery] = useState("");

  if (selected) {
    const row = COHORT.find((r) => r.id === selected)!;
    return <DrillIn key={selected} submission={{ ...submission, label: row.label }} onBack={() => setSelected(null)} />;
  }

  const rows = COHORT.filter((r) => r.label.toLowerCase().includes(query.toLowerCase()))
    .map((r) => ({ ...r, pat: classify(r.strength) }));
  const counts = ORDER.map((p) => ({ p, n: rows.filter((r) => r.pat === p).length }));

  const Row = (r: (typeof rows)[number]) => (
    <button className="vg-row" key={r.id} onClick={() => setSelected(r.id)}>
      <span className="vg-row__name">{r.label}</span>
      <span className="vg2-rollup">
        {r.strength.map((v, i) => (
          <span key={i} className={`vg2-bar b-${band(v)}`} title={`${COHORT_CRITERIA[i]} ${v}`}>
            <span style={{ height: `${v}%` }} />
          </span>
        ))}
      </span>
      <span className={`vg2-pat p-${r.pat}`}>{PATTERN[r.pat].label}</span>
      <span className="vg-row__status">{r.reviewed ? "✓ reviewed" : "—"}</span>
      <span className="vd-chevron">›</span>
    </button>
  );

  return (
    <div className="vg-overview">
      <div className="rv-topbar">
        <h1>Cohort review · Reflective report</h1>
        <span className="spacer" />
        <span className="observation-note">{rows.length} of {COHORT_TOTAL} · triage by shape</span>
      </div>

      <div className="vg-controls">
        <input className="vg-search" placeholder="Filter students…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="observation-note">Sort:&nbsp;
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="pattern">Group by shape</option>
            <option value="name">Name</option>
            <option value="reviewed">Not yet reviewed</option>
          </select>
        </label>
        <span className="vg2-legend">
          {COHORT_CRITERIA.map((c) => <span key={c}>{c}</span>)}
          <span className="vg2-key"><i className="b-low" /> low <i className="b-mid" /> mid <i className="b-high" /> high</span>
        </span>
        <span className="observation-note" style={{ marginLeft: "auto" }}>
          {counts.filter((c) => c.p !== "even").map((c) => `${c.n} ${c.p}`).join(" · ")} — the rest are even
        </span>
      </div>

      <div className="vg-list">
        {sort === "pattern"
          ? ORDER.map((p) => {
              const items = rows.filter((r) => r.pat === p);
              if (!items.length) return null;
              return (
                <section className="vg2-group" key={p} data-pat={p}>
                  <header><strong>{PATTERN[p].label}</strong> <span className="observation-note">{PATTERN[p].note}</span> <span className="vg2-group__n">{items.length}</span></header>
                  {items.map(Row)}
                </section>
              );
            })
          : [...rows]
              .sort((a, b) => (sort === "name" ? a.label.localeCompare(b.label) : Number(a.reviewed) - Number(b.reviewed)))
              .map(Row)}
      </div>
    </div>
  );
}

function DrillIn({ submission, onBack }: { submission: Submission; onBack: () => void }) {
  const [reveal, setReveal] = useState(false);
  const [stances, setStances] = useState<Record<string, Stance>>({});

  const all = submission.criteria.flatMap((c) =>
    c.signals.map((s) => ({ ...s, crit: c.title, att: ATTENTION[s.id] ?? "low" })),
  );
  const groups = (["high", "medium", "low"] as const)
    .map((level) => ({ level, items: all.filter((s) => s.att === level) }))
    .filter((g) => g.items.length);

  return (
    <div className="vg-drill">
      <div className="rv-topbar">
        <button className="btn" onClick={onBack}>← Cohort</button>
        <h1>{submission.label}</h1>
        {submission.files.map((f) => (
          <button key={f.name} className="rv-filechip btn-open" onClick={() => openOriginal(f.name)}>{f.name}</button>
        ))}
        <span className="spacer" />
        <button className="btn" onClick={() => setReveal((r) => !r)}>{reveal ? "Hide estimate" : "Reveal estimate"}</button>
      </div>
      <div className="vd-wrap">
        <p className="va-banner">Individual view — work the signals the tool is least sure about first. You set the mark.</p>
        {groups.map((g) => (
          <section className="vd-group" data-level={g.level} key={g.level}>
            <header style={{ cursor: "default" }}>
              <span className="vd-dot" data-level={g.level} /><h3>{GROUP[g.level]}</h3><span className="vd-count">{g.items.length}</span>
            </header>
            {g.items.map((s) => (
              <div className="vd-item" key={s.id}>
                <div className="vd-item__top"><span className="vd-item__crit">{s.crit}</span><span className="source-tag">{s.source}</span></div>
                <div className="vd-item__obs">{s.observation}</div>
                <blockquote className="evidence">“{s.evidence[0].quote}”<span className="loc">{s.evidence[0].locator}</span></blockquote>
                {COHORT_CONTEXT[s.id] && <div className="vg-cohort-context">vs cohort · {COHORT_CONTEXT[s.id]}</div>}
                <div style={{ marginTop: 10 }}>
                  <StanceButtons value={stances[s.id] ?? "unset"} onChange={(v) => setStances({ ...stances, [s.id]: v })} />
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
