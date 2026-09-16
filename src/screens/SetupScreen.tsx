// Setup — pick a rubric + a submissions folder, set per-criterion max marks,
// opt into local-AI narration, run. Also offers the last cohort for reuse.
import type { LastRun, RubricInfo, SidecarStatus } from "../../global";
import { OllamaSetupCard } from "../components/OllamaSetupCard";
import { summarise } from "../marks";
import type { AssessmentResult } from "../types";

interface Props {
  engineStatus: SidecarStatus;
  rubricPath: string | null;
  rubric: RubricInfo | null;
  criteriaMax: Record<string, number>;
  onCriteriaMax: (next: Record<string, number>) => void;
  submissionsPath: string | null;
  llm: boolean;
  onPickRubric: (path: string) => void;
  onPickSubmissions: (path: string) => void;
  onLlm: (v: boolean) => void;
  onStart: () => void;
  onRestartEngine: () => void;
  lastRun: { run: LastRun; result: AssessmentResult } | null;
  onResume: () => void;
  onDismissResume: () => void;
}

export function SetupScreen(p: Props) {
  const canRun =
    p.engineStatus.phase === "ready" && !!p.rubricPath && !!p.submissionsPath;
  const engineHint: Record<SidecarStatus["phase"], string> = {
    "not-started": "engine idle",
    installing: "setting up the engine (first run only)…",
    starting: "starting the engine…",
    ready: "",
    unreachable: "engine offline",
    crashed: "engine stopped",
  };
  const engineDown =
    p.engineStatus.phase === "crashed" || p.engineStatus.phase === "unreachable";
  const onRubricPicked = async () => {
    const path = await window.lens.pickFile([{ name: "Rubric", extensions: ["yaml", "yml", "json"] }]);
    if (path) p.onPickRubric(path);
  };

  return (
    <div className="screen setup">
      {p.lastRun && (
        <div className="card pad resume">
          <div className="row">
            <div>
              <strong>{p.lastRun.result.assignment || "Last cohort"}</strong>{" "}
              <span className="muted">
                {summarise(p.lastRun.result)} · {p.lastRun.run.submissionsPath}
              </span>
            </div>
            <span className="spacer" />
            <button className="btn accent" onClick={p.onResume}>
              Continue marking
            </button>
            <button className="btn" onClick={p.onDismissResume}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="card pad">
        <div className="pickrow">
          <button className="btn" onClick={onRubricPicked}>
            Choose rubric…
          </button>
          <span className="path">{p.rubricPath ?? "YAML or JSON — `assessment-lens draft-rubric` can draft one"}</span>
        </div>

        {p.rubric && (
          <>
            <div className="pickrow" style={{ marginTop: 12 }}>
              <button className="btn" onClick={async () => p.onPickSubmissions((await window.lens.pickDir()) ?? "")}>
                Choose submissions folder…
              </button>
              <span className="path">
                {p.submissionsPath ?? "one subfolder per student or group"}
              </span>
            </div>

            {p.rubric.criteria.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <table className="critmax">
                  <thead>
                    <tr>
                      <th>Criterion</th>
                      <th>Max mark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.rubric.criteria.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.id}</strong>
                          {c.description ? <span className="muted"> — {c.description}</span> : null}
                        </td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={p.criteriaMax[c.id] ?? ""}
                            onChange={(e) =>
                              p.onCriteriaMax({
                                ...p.criteriaMax,
                                [c.id]: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="hint" style={{ marginBottom: 0 }}>
                  Totals are summed per criterion. A <code>max_mark:</code> in the rubric YAML is
                  picked up automatically; these values can be adjusted for each cohort.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="card pad">
        <label className="check">
          <input type="checkbox" checked={p.llm} onChange={(e) => p.onLlm(e.target.checked)} />
          Narrate observations with the local AI (private, on this machine)
        </label>
        <p className="hint" style={{ marginTop: 6, marginBottom: 0 }}>
          Observations, not grades — the app never assigns a mark. Works fully without the AI;
          narration just adds prose bound to the cited evidence.
        </p>
      </div>

      <div className="setupactions">
        <button className="btn accent" disabled={!canRun} onClick={p.onStart}>
          {p.rubricPath && p.submissionsPath ? "Assess cohort" : "Assess cohort (pick a rubric + folder above)"}
        </button>
        {!canRun && (
          <span className="hint">
            {[
              p.engineStatus.phase !== "ready" ? engineHint[p.engineStatus.phase] : null,
              !p.rubricPath ? "no rubric selected" : null,
              !p.submissionsPath ? "no submissions folder selected" : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        )}
        {engineDown && (
          <button className="btn small" onClick={p.onRestartEngine}>
            Restart engine
          </button>
        )}
      </div>

      <OllamaSetupCard />
    </div>
  );
}
