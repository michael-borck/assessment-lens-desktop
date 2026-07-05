// PROTOTYPE — Variant B: document alongside signals (split view). Throwaway.
// Philosophy: read the submission summary and the signals side by side. Click a
// signal to spotlight its evidence in the text — the sniff-test is the center.
import { useMemo, useRef, useState } from "react";
import type { Stance, Submission } from "./mock";
import { StanceButtons, Topbar } from "./shared";

interface Tagged { sigId: string; quote: string; }

export function VariantB({ submission }: { submission: Submission }) {
  const [reveal, setReveal] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [stances, setStances] = useState<Record<string, Stance>>({});
  const docRef = useRef<HTMLParagraphElement>(null);

  const flatSignals = submission.criteria.flatMap((c) =>
    c.signals.map((s) => ({ ...s, critTitle: c.title })),
  );

  // Build the summary with evidence quotes wrapped in <mark> where they occur.
  const segments = useMemo(() => {
    const tags: Tagged[] = flatSignals
      .map((s) => ({ sigId: s.id, quote: s.evidence[0]?.quote ?? "" }))
      .filter((t) => t.quote && submission.summary.includes(t.quote));
    let rest = submission.summary;
    const out: Array<{ text: string; sigId?: string }> = [];
    while (rest.length) {
      // find the earliest-occurring remaining tag
      let best: { idx: number; tag: Tagged } | null = null;
      for (const tag of tags) {
        const idx = rest.indexOf(tag.quote);
        if (idx >= 0 && (!best || idx < best.idx)) best = { idx, tag };
      }
      if (!best) { out.push({ text: rest }); break; }
      if (best.idx > 0) out.push({ text: rest.slice(0, best.idx) });
      out.push({ text: best.tag.quote, sigId: best.tag.sigId });
      rest = rest.slice(best.idx + best.tag.quote.length);
    }
    return out;
  }, [flatSignals, submission.summary]);

  const focus = (sigId: string) => {
    setActive(sigId);
    requestAnimationFrame(() => {
      docRef.current?.querySelector<HTMLElement>(`mark[data-sig="${sigId}"]`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  };

  return (
    <>
      <Topbar submission={submission} reveal={reveal} onToggleReveal={() => setReveal((r) => !r)} />
      <div className="vb-grid">
        <div className="vb-doc">
          <h4>Extracted summary · {submission.files[0].name}</h4>
          <p ref={docRef}>
            {segments.map((seg, i) =>
              seg.sigId ? (
                <mark key={i} data-sig={seg.sigId} className={active === seg.sigId ? "hot" : ""}>
                  {seg.text}
                </mark>
              ) : (
                <span key={i}>{seg.text}</span>
              ),
            )}
          </p>
          <p className="observation-note" style={{ marginTop: 16 }}>
            Summary only — click “{submission.files[0].name}” above to open the original.
          </p>
        </div>

        <div className="vb-signals">
          {reveal && (
            <div className="estimate-veil" style={{ marginBottom: 12 }}>
              overall estimate <span className="num">21/30</span>
            </div>
          )}
          {flatSignals.map((s) => (
            <div
              key={s.id}
              className="vb-sigcard"
              data-active={active === s.id ? "1" : "0"}
              onMouseEnter={() => focus(s.id)}
            >
              <div className="vb-sigcard__crit">{s.critTitle}</div>
              <div className="vb-sigcard__obs">{s.observation}</div>
              <blockquote className="evidence">
                “{s.evidence[0].quote}”<span className="loc">{s.evidence[0].locator}</span>
              </blockquote>
              <div className="vb-sigcard__foot">
                <span className="source-tag">{s.source}</span>
                <StanceButtons
                  value={stances[s.id] ?? "unset"}
                  onChange={(v) => setStances({ ...stances, [s.id]: v })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
