// PROTOTYPE — Variant D: attention/confidence triage. Throwaway.
// Philosophy (scale): don't make the lecturer read a flat list of every signal.
// Group by how much HUMAN attention each needs — surface the few the tool is least
// sure about; collapse the "looks consistent" majority. Built for big cohorts.
import { useState } from "react";
import type { Stance, Submission } from "./mock";
import { StanceButtons, Topbar } from "./shared";

type Level = "high" | "medium" | "low";
const ATTENTION: Record<string, Level> = { s1: "high", t1: "medium" }; // rest → low
const GROUP: Record<Level, { title: string; note: string }> = {
  high: { title: "Needs your attention", note: "the tool is least sure here" },
  medium: { title: "Worth a look", note: "minor or context-dependent" },
  low: { title: "Looks consistent", note: "nothing unusual — skim or skip" },
};

export function VariantD({ submission }: { submission: Submission }) {
  const [reveal, setReveal] = useState(false);
  const [stances, setStances] = useState<Record<string, Stance>>({});
  const [collapsed, setCollapsed] = useState<Record<Level, boolean>>({ high: false, medium: false, low: true });

  const all = submission.criteria.flatMap((c) =>
    c.signals.map((s) => ({ ...s, crit: c.title, att: ATTENTION[s.id] ?? ("low" as Level) })),
  );
  const groups = (["high", "medium", "low"] as Level[]).map((level) => ({
    level,
    items: all.filter((s) => s.att === level),
  }));

  return (
    <>
      <Topbar submission={submission} reveal={reveal} onToggleReveal={() => setReveal((r) => !r)} />
      <div className="vd-wrap">
        <div className="vd-summary">
          {groups.map((g) => (
            <span key={g.level} className="vd-chip" data-level={g.level}>
              <strong>{g.items.length}</strong> {GROUP[g.level].title.toLowerCase()}
            </span>
          ))}
          <span className="observation-note" style={{ marginLeft: "auto" }}>
            Sorted by attention needed, not by rubric order — go where the tool is least confident.
          </span>
        </div>

        {groups.map((g) =>
          g.items.length === 0 ? null : (
            <section className="vd-group" data-level={g.level} key={g.level}>
              <header onClick={() => setCollapsed({ ...collapsed, [g.level]: !collapsed[g.level] })}>
                <span className="vd-dot" data-level={g.level} />
                <h3>{GROUP[g.level].title}</h3>
                <span className="observation-note">{GROUP[g.level].note}</span>
                <span className="vd-count">{g.items.length}</span>
                <span className="vd-chevron">{collapsed[g.level] ? "▸" : "▾"}</span>
              </header>
              {!collapsed[g.level] &&
                g.items.map((s) => (
                  <div className="vd-item" key={s.id}>
                    <div className="vd-item__top">
                      <span className="vd-item__crit">{s.crit}</span>
                      <span className="source-tag">{s.source}</span>
                    </div>
                    <div className="vd-item__obs">{s.observation}</div>
                    <blockquote className="evidence">
                      “{s.evidence[0].quote}”<span className="loc">{s.evidence[0].locator}</span>
                    </blockquote>
                    <div style={{ marginTop: 10 }}>
                      <StanceButtons
                        value={stances[s.id] ?? "unset"}
                        onChange={(v) => setStances({ ...stances, [s.id]: v })}
                      />
                    </div>
                  </div>
                ))}
            </section>
          ),
        )}
      </div>
    </>
  );
}
