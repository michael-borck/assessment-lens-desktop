// PROTOTYPE — Variant F: document-timeline view. Throwaway.
// Philosophy: read the submission as a narrative. Lay signals along the document's
// own structure (Introduction → Methodology → Discussion → Conclusion → References)
// rather than by rubric, so the lecturer sees WHERE each observation sits.
import { useState } from "react";
import type { Stance, Submission } from "./mock";
import { StanceButtons, Topbar } from "./shared";

const SECTIONS = ["Introduction", "Methodology", "Discussion", "Conclusion", "References", "Throughout"];

function sectionOf(locator: string): string {
  const w = locator.split(/[\s¶]/)[0].toLowerCase();
  return SECTIONS.find((s) => s.toLowerCase().startsWith(w)) ?? "Throughout";
}

export function VariantF({ submission }: { submission: Submission }) {
  const [reveal, setReveal] = useState(false);
  const [stances, setStances] = useState<Record<string, Stance>>({});

  const all = submission.criteria.flatMap((c) =>
    c.signals.map((s) => ({ ...s, crit: c.title, section: sectionOf(s.evidence[0].locator) })),
  );
  const bySection = SECTIONS.map((sec) => ({ sec, items: all.filter((s) => s.section === sec) }));

  return (
    <>
      <Topbar submission={submission} reveal={reveal} onToggleReveal={() => setReveal((r) => !r)} />
      <div className="vf-wrap">
        <p className="va-banner">
          Signals laid along the submission’s own structure — see <strong>where</strong> each
          observation occurs as you read top to bottom.
        </p>
        <div className="vf-timeline">
          {bySection.map(({ sec, items }) => (
            <div className="vf-stage" key={sec} data-empty={items.length === 0 ? "1" : "0"}>
              <div className="vf-spine">
                <span className="vf-node" />
                <span className="vf-sec">{sec}</span>
              </div>
              <div className="vf-signals">
                {items.length === 0 ? (
                  <span className="observation-note">no signals here</span>
                ) : (
                  items.map((s) => (
                    <div className="vf-card" key={s.id}>
                      <div className="vf-card__crit">{s.crit}</div>
                      <div className="vf-card__obs">{s.observation}</div>
                      <blockquote className="evidence">
                        “{s.evidence[0].quote}”<span className="loc">{s.evidence[0].locator}</span>
                      </blockquote>
                      <div className="vf-card__foot">
                        <span className="source-tag">{s.source}</span>
                        <StanceButtons
                          value={stances[s.id] ?? "unset"}
                          onChange={(v) => setStances({ ...stances, [s.id]: v })}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
