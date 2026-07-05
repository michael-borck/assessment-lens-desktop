import { useEffect, useRef, useState } from "react";
import type { SidecarStatus } from "../global";
import { CohortResults, type AssessmentResult } from "./components/CohortResults";
import { EngineStatus } from "./components/EngineStatus";
import { FirstRunModal } from "./components/FirstRunModal";
import { OllamaSetupCard } from "./components/OllamaSetupCard";

type RunState = "idle" | "running" | "done" | "failed";

export function App() {
  const [status, setStatus] = useState<SidecarStatus>({ phase: "not-started", url: "" });
  const [setupPhase, setSetupPhase] = useState("");
  const [rubric, setRubric] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<string | null>(null);
  const [llm, setLlm] = useState(false);
  const [run, setRun] = useState<RunState>("idle");
  const [progress, setProgress] = useState<string[]>([]);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollFailures = useRef(0);

  useEffect(() => {
    window.lens.sidecarStatus().then(setStatus);
    const offStatus = window.lens.onSidecarStatus(setStatus);
    const offPhase = window.lens.onSetupPhase(setSetupPhase);
    return () => {
      offStatus();
      offPhase();
      if (poll.current) clearInterval(poll.current);
    };
  }, []);

  const ready = status.phase === "ready";
  const installing = setupPhase === "installing" || status.phase === "installing";

  async function start() {
    if (!rubric || !submissions) return;
    setRun("running");
    setProgress([]);
    setResult(null);
    setError(null);
    const res = await window.lens.api("POST", "/assessments", { rubric, submissions, llm });
    if (res.status !== 202) {
      setError(`could not start (HTTP ${res.status})`);
      setRun("failed");
      return;
    }
    const { id } = res.body as { id: string };
    pollFailures.current = 0;
    poll.current = setInterval(async () => {
      // Tolerate transient blips (engine restart, brief unreachability) but
      // give up after ~10 s of consecutive failures instead of polling forever.
      const fail = () => {
        if (++pollFailures.current >= 20) {
          clearInterval(poll.current!);
          setError("lost contact with the engine — check its status and try again");
          setRun("failed");
        }
      };
      let s;
      try {
        s = await window.lens.api("GET", `/assessments/${id}`);
      } catch {
        fail();
        return;
      }
      if (s.status !== 200) {
        fail();
        return;
      }
      pollFailures.current = 0;
      const body = s.body as { status: RunState; progress: string[]; error: string };
      setProgress(body.progress ?? []);
      if (body.status === "done") {
        clearInterval(poll.current!);
        const r = await window.lens.api("GET", `/assessments/${id}/result`);
        setResult(r.body as AssessmentResult);
        setRun("done");
      } else if (body.status === "failed") {
        clearInterval(poll.current!);
        setError(body.error || "assessment failed");
        setRun("failed");
      }
    }, 500);
  }

  const btn = { padding: "6px 12px", borderRadius: 6, border: "1px solid #bbb", cursor: "pointer" };

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 920, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>Assessment Lens</h1>
        <EngineStatus status={status} />
      </header>

      {installing && <FirstRunModal />}

      <section style={{ marginTop: 20, display: "grid", gap: 10 }}>
        <div>
          <button
            style={btn}
            onClick={async () =>
              setRubric(await window.lens.pickFile([{ name: "Rubric", extensions: ["yaml", "yml", "json"] }]))
            }
          >
            Choose rubric…
          </button>
          <span style={{ marginLeft: 10, color: "#555", fontSize: 13 }}>{rubric ?? "no rubric selected"}</span>
        </div>
        <div>
          <button style={btn} onClick={async () => setSubmissions(await window.lens.pickDir())}>
            Choose submissions folder…
          </button>
          <span style={{ marginLeft: 10, color: "#555", fontSize: 13 }}>
            {submissions ?? "no folder selected"}
          </span>
        </div>
        <label style={{ fontSize: 13, color: "#555" }}>
          <input type="checkbox" checked={llm} onChange={(e) => setLlm(e.target.checked)} /> Narrate with
          the local AI (needs Ollama; observations, never scores)
        </label>
        <div>
          <button
            style={{ ...btn, opacity: ready && rubric && submissions && run !== "running" ? 1 : 0.5 }}
            disabled={!ready || !rubric || !submissions || run === "running"}
            onClick={start}
          >
            {run === "running" ? "Assessing…" : "Assess cohort"}
          </button>
          {!ready && (
            <span style={{ marginLeft: 10, fontSize: 13, color: "#b8860b" }}>waiting for the engine…</span>
          )}
        </div>
      </section>

      {run === "running" && (
        <pre
          style={{
            background: "#111",
            color: "#ddd",
            padding: 12,
            borderRadius: 6,
            fontSize: 12,
            maxHeight: 160,
            overflow: "auto",
          }}
        >
          {progress.join("\n") || "starting…"}
        </pre>
      )}
      {error && <p style={{ color: "#c62828" }}>Error: {error}</p>}

      {result && (
        <section style={{ marginTop: 20 }}>
          <CohortResults result={result} />
        </section>
      )}

      {!result && (
        <section style={{ marginTop: 24 }}>
          <OllamaSetupCard />
        </section>
      )}
    </main>
  );
}
