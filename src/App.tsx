// Assessment Lens — the marking workflow: setup → run → cohort triage →
// student review (the human's marks) → export. The engine narrates and cites;
// it never scores — every mark here is the marker's, persisted locally.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResponse, LastRun, RubricInfo, SidecarStatus } from "../global";
import { EngineStatus } from "./components/EngineStatus";
import { FirstRunModal } from "./components/FirstRunModal";
import { CohortScreen } from "./screens/CohortScreen";
import { SetupScreen } from "./screens/SetupScreen";
import { StudentScreen } from "./screens/StudentScreen";
import {
  buildMarksCsv,
  emptyStudent,
  reconcileSheet,
  runKey,
} from "./marks";
import type { AssessmentResult, MarkSheet } from "./types";
import "./app.css";

type Screen = "setup" | "running" | "cohort" | "student";
type RunState = "idle" | "running" | "done" | "failed";

function defaultCriteriaMax(rubric: RubricInfo): Record<string, number> {
  const n = rubric.criteria.length || 1;
  const share = Math.round((100 / n) * 10) / 10;
  return Object.fromEntries(rubric.criteria.map((c) => [c.id, c.maxMark ?? share]));
}

export function App() {
  const [status, setStatus] = useState<SidecarStatus>({ phase: "not-started", url: "" });
  const [setupPhase, setSetupPhase] = useState("");
  const [screen, setScreen] = useState<Screen>("setup");

  const [rubricPath, setRubricPath] = useState<string | null>(null);
  const [rubric, setRubric] = useState<RubricInfo | null>(null);
  const [criteriaMax, setCriteriaMax] = useState<Record<string, number>>({});
  const [submissionsPath, setSubmissionsPath] = useState<string | null>(null);
  const [llm, setLlm] = useState(false);
  const [heuristics, setHeuristics] = useState(true);

  const [run, setRun] = useState<RunState>("idle");
  const [progress, setProgress] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reRunning, setReRunning] = useState<string | null>(null);

  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [sheet, setSheet] = useState<MarkSheet | null>(null);
  const [sid, setSid] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<LastRun | null>(null);

  const poll = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollFailures = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    window.lens.sidecarStatus().then(setStatus);
    const offStatus = window.lens.onSidecarStatus(setStatus);
    const offPhase = window.lens.onSetupPhase(setSetupPhase);
    window.lens.loadLastRun().then((r) => {
      if (r && r.result && r.rubric) setLastRun(r);
    });
    window.lens.config().then((c) => setHeuristics(c.settings.heuristics !== false));
    return () => {
      offStatus();
      offPhase();
      if (poll.current) clearInterval(poll.current);
    };
  }, []);

  const criteria = rubric
    ? rubric.criteria.map((c) => ({ id: c.id, max: criteriaMax[c.id] ?? c.maxMark ?? 0 }))
    : [];

  // Auto-save the mark sheet (debounced) — a crash must never lose marks.
  useEffect(() => {
    if (!sheet) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void window.lens.saveMarks(sheet.key, sheet), 500);
  }, [sheet]);

  const adoptResult = useCallback(
    async (next: AssessmentResult, opts: { rubricPath: string; submissionsPath: string; llm: boolean; rubric: RubricInfo; max: Record<string, number> }) => {
      const key = runKey(opts.rubricPath, opts.submissionsPath);
      const critList = opts.rubric.criteria.map((c) => ({ id: c.id, max: opts.max[c.id] ?? c.maxMark ?? 0 }));
      // Keep any marks already recorded for this rubric + cohort combination.
      const prior = (await window.lens.loadMarks(key)) as MarkSheet | null;
      const merged = reconcileSheet(
        prior && prior.version === 1
          ? { ...prior, key, assignment: next.assignment, criteria: critList }
          : { version: 1, key, assignment: next.assignment, criteria: critList, students: {} },
        critList,
      );
      for (const s of next.submissions) {
        if (!merged.students[s.submission_id]) {
          merged.students[s.submission_id] = emptyStudent(critList);
        }
      }
      setResult(next);
      setSheet(merged);
      const snapshot: LastRun = {
        key,
        rubricPath: opts.rubricPath,
        submissionsPath: opts.submissionsPath,
        llm: opts.llm,
        rubric: opts.rubric,
        criteriaMax: opts.max,
        result: next,
      };
      setLastRun(snapshot);
      await window.lens.saveLastRun(snapshot);
      setScreen("cohort");
    },
    [],
  );

  const startAssessment = useCallback(
    async (only?: string[]) => {
      if (!rubricPath || !submissionsPath || !rubric) return;
      setRun("running");
      setProgress([]);
      setError(null);
      setReRunning(only?.[0] ?? null);
      const res = await window.lens.api("POST", "/assessments", {
        rubric: rubricPath,
        submissions: submissionsPath,
        llm,
        ...(only ? { only } : {}),
      });
      if (res.status !== 202) {
        setError(`could not start (HTTP ${res.status})`);
        setRun("failed");
        setReRunning(null);
        return;
      }
      const { id } = res.body as { id: string };
      pollFailures.current = 0;
      if (poll.current) clearInterval(poll.current);
      poll.current = setInterval(async () => {
        // Tolerate transient blips (engine restart, brief unreachability) but
        // give up after ~10 s of consecutive failures instead of polling forever.
        const fail = () => {
          if (++pollFailures.current >= 20) {
            clearInterval(poll.current!);
            setError("lost contact with the engine — check its status and try again");
            setRun("failed");
            setReRunning(null);
          }
        };
        let s: ApiResponse;
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
          const next = r.body as AssessmentResult;
          if (only && result) {
            // Single-submission re-run: splice the fresh entry into the cohort.
            const merged: AssessmentResult = {
              ...result,
              submissions: result.submissions.map((old) =>
                old.submission_id === next.submissions[0]?.submission_id
                  ? next.submissions[0]
                  : old,
              ),
            };
            await adoptResult(merged, {
              rubricPath,
              submissionsPath,
              llm,
              rubric,
              max: criteriaMax,
            });
          } else {
            await adoptResult(next, { rubricPath, submissionsPath, llm, rubric, max: criteriaMax });
          }
          setRun("done");
          setReRunning(null);
        } else if (body.status === "failed") {
          clearInterval(poll.current!);
          setError(body.error || "assessment failed");
          setRun("failed");
          setReRunning(null);
        }
      }, 500);
    },
    [rubricPath, submissionsPath, rubric, llm, criteriaMax, result, adoptResult],
  );

  async function resume() {
    if (!lastRun) return;
    setRubricPath(lastRun.rubricPath);
    setSubmissionsPath(lastRun.submissionsPath);
    setLlm(lastRun.llm);
    setRubric(lastRun.rubric);
    setCriteriaMax(lastRun.criteriaMax);
    const r = lastRun.result as AssessmentResult;
    const critList = lastRun.rubric.criteria.map((c) => ({
      id: c.id,
      max: lastRun.criteriaMax[c.id] ?? c.maxMark ?? 0,
    }));
    const prior = (await window.lens.loadMarks(lastRun.key)) as MarkSheet | null;
    const merged = reconcileSheet(
      prior && prior.version === 1
        ? { ...prior, key: lastRun.key, assignment: r.assignment, criteria: critList }
        : { version: 1, key: lastRun.key, assignment: r.assignment, criteria: critList, students: {} },
      critList,
    );
    setResult(r);
    setSheet(merged);
    setScreen("cohort");
  }

  const okSubs = result?.submissions.filter((s) => !s.error) ?? [];
  const sidIdx = okSubs.findIndex((s) => s.submission_id === sid);

  function goStudent(next: string) {
    setSid(next);
    setScreen("student");
  }
  function step(delta: number) {
    if (sidIdx < 0 || !okSubs.length) return;
    const n = (sidIdx + delta + okSubs.length) % okSubs.length;
    goStudent(okSubs[n].submission_id);
  }

  const installing = setupPhase === "installing" || status.phase === "installing";

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Assessment&nbsp;Lens</div>
        {screen !== "setup" && result && (
          <nav className="crumbs">
            <span className={screen === "cohort" ? "here" : "muted"}>{result.assignment || "Cohort"}</span>
            {screen === "student" && sid && (
              <>
                <span className="sep">/</span>
                <span className="here">{sid}</span>
              </>
            )}
          </nav>
        )}
        <span className="spacer" />
        <EngineStatus status={status} />
      </header>

      {installing && <FirstRunModal />}
      {error && screen !== "running" && (
        <div className="screen" style={{ paddingBottom: 0 }}>
          <div className="errorbox">
            {error}{" "}
            <button className="btn small" onClick={() => setError(null)}>
              dismiss
            </button>
          </div>
        </div>
      )}

      {screen === "setup" && (
        <SetupScreen
          engineStatus={status}
          rubricPath={rubricPath}
          rubric={rubric}
          criteriaMax={criteriaMax}
          onCriteriaMax={setCriteriaMax}
          submissionsPath={submissionsPath}
          llm={llm}
          onPickRubric={async (path) => {
            try {
              const info = await window.lens.parseRubric(path);
              setRubricPath(path);
              setRubric(info);
              setCriteriaMax(defaultCriteriaMax(info));
              setError(null);
            } catch (e) {
              setError(`could not read the rubric: ${e instanceof Error ? e.message : String(e)}`);
            }
          }}
          onPickSubmissions={(path) => {
            if (path) setSubmissionsPath(path);
          }}
          onLlm={setLlm}
          heuristics={heuristics}
          onHeuristics={(enabled) => {
            setHeuristics(enabled);
            void window.lens.setHeuristics(enabled);
          }}
          onStart={() => {
            setScreen("running");
            void startAssessment();
          }}
          onRestartEngine={() => void window.lens.restartEngine()}
          lastRun={lastRun && result === null ? { run: lastRun, result: lastRun.result as AssessmentResult } : null}
          onResume={() => void resume()}
          onDismissResume={() => setLastRun(null)}
        />
      )}

      {screen === "running" && (
        <div className="screen">
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>
            {reRunning ? `Re-running ${reRunning}…` : "Assessing the cohort…"}
          </h2>
          <div className="runlog">{progress.slice(-14).join("\n") || "starting…"}</div>
          {run === "failed" && (
            <p style={{ marginTop: 12 }}>
              <button className="btn" onClick={() => setScreen("setup")}>
                ← Back to setup
              </button>
            </p>
          )}
        </div>
      )}

      {screen === "cohort" && result && sheet && (
        <CohortScreen
          result={result}
          criteria={criteria}
          sheet={sheet}
          onOpen={goStudent}
          onReRun={(id) => void startAssessment([id])}
          reRunning={reRunning}
          onReAssess={() => {
            setScreen("running");
            void startAssessment();
          }}
          onExport={async () => {
            const path = await window.lens.exportCsv(
              `${(result.assignment || "marks").replace(/[^\w-]+/g, "-")}-marks.csv`,
              buildMarksCsv(sheet, result.submissions),
            );
            if (path) setProgress([...progress, `exported ${path}`]);
          }}
          onNewRun={() => {
            setResult(null);
            setSheet(null);
            setScreen("setup");
          }}
        />
      )}

      {screen === "student" && result && sheet && sid && sidIdx >= 0 && rubric && (
        <StudentScreen
          sub={okSubs[sidIdx]}
          rubric={rubric}
          criteria={criteria}
          sheet={sheet}
          onChange={(m) =>
            setSheet((prev) =>
              prev
                ? { ...prev, students: { ...prev.students, [sid]: m } }
                : prev,
            )
          }
          onClose={() => setScreen("cohort")}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          position={`${sidIdx + 1} of ${okSubs.length}`}
          submissionsPath={submissionsPath ?? ""}
        />
      )}
    </div>
  );
}
