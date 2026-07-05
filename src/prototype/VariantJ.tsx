// PROTOTYPE — Variant J: signal → rubric mapping (iterative configurator). Throwaway.
// There are many signals. The lecturer maps a SET to each rubric criterion — and
// this is iterative: run all, skim, prune or add, re-run; or start minimal and add
// signals if marks don't separate. Signals are read in COMBINATION, never alone.
import { useState } from "react";
import type { Submission } from "./mock";
import { RUBRIC_MAP, SIGNAL_CATALOGUE } from "./mock-dashboard";

const NAME = Object.fromEntries(SIGNAL_CATALOGUE.map((s) => [s.id, s]));
type Mapping = Record<string, string[]>;

const PRESETS: Record<string, Mapping> = {
  Minimal: { critical: ["crit_thinking"], sources: ["ref_verify"], structure: ["readability_var"] },
  Balanced: Object.fromEntries(RUBRIC_MAP.map((c) => [c.id, c.mapped])),
  All: Object.fromEntries(
    RUBRIC_MAP.map((c) => [c.id, c.id === "critical"
      ? ["crit_thinking", "reflection_depth", "iteration", "prompt_var", "distinctiveness"]
      : c.id === "sources" ? ["ref_verify", "ref_crossref"]
      : ["readability_var", "structure", "sentiment", "distinctiveness"]]),
  ),
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function VariantJ(_props: { submission: Submission }) {
  const [map, setMap] = useState<Mapping>(PRESETS.Balanced);
  const [preset, setPreset] = useState("Balanced");

  const applyPreset = (p: string) => { setPreset(p); setMap(PRESETS[p]); };
  const remove = (crit: string, sig: string) => {
    setPreset("Custom");
    setMap({ ...map, [crit]: map[crit].filter((s) => s !== sig) });
  };
  const add = (crit: string, sig: string) => {
    if (!sig || map[crit].includes(sig)) return;
    setPreset("Custom");
    setMap({ ...map, [crit]: [...map[crit], sig] });
  };

  const distinct = new Set(Object.values(map).flat()).size;

  return (
    <div className="vj-wrap">
      <div className="rv-topbar">
        <span className="crumb">PHIL201 · Reflective report ‹</span>
        <h1>Map signals to the rubric</h1>
        <span className="spacer" />
        <span className="observation-note">{distinct} of {SIGNAL_CATALOGUE.length} signals in use</span>
        <button className="btn btn-accent">Re-run with this mapping</button>
      </div>

      <div className="vj-body">
        <div className="vj-presets">
          Start from:
          {Object.keys(PRESETS).map((p) => (
            <button key={p} className={`vj-preset ${preset === p ? "on" : ""}`} onClick={() => applyPreset(p)}>{p}</button>
          ))}
          {preset === "Custom" && <span className="vj-preset on">Custom</span>}
          <span className="observation-note" style={{ marginLeft: "auto" }}>
            Iterate freely — fewer signals means nothing extra to compute; adding signals re-runs only the new ones.
          </span>
        </div>

        {RUBRIC_MAP.map((c) => {
          const used = map[c.id] ?? [];
          const available = SIGNAL_CATALOGUE.filter((s) => !used.includes(s.id));
          return (
            <section className="vj-crit" key={c.id}>
              <div className="vj-crit__title">{c.title}</div>
              <div className="vj-chips">
                {used.length === 0 && <span className="observation-note">no signals — this criterion won't have observations</span>}
                {used.map((sid) => (
                  <span className="vj-chip" key={sid}>
                    {NAME[sid].name}
                    <span className="vj-chip__src">{NAME[sid].source}</span>
                    <button className="vj-chip__x" onClick={() => remove(c.id, sid)} aria-label="remove">×</button>
                  </span>
                ))}
                <select className="vj-add" value="" onChange={(e) => add(c.id, e.target.value)}>
                  <option value="">+ add signal…</option>
                  {available.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </section>
          );
        })}

        <p className="observation-note" style={{ marginTop: 16 }}>
          Signals are read <strong>in combination</strong> — a high on one beside a low on another, or a set that
          stands out from the cohort, is what prompts a closer look. No single signal decides anything; you do.
        </p>
      </div>
    </div>
  );
}
