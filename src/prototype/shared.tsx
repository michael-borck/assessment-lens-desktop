// PROTOTYPE — small shared bits (header + stance control). Throwaway.
import type { Stance, Submission } from "./mock";

export function openOriginal(file: string) {
  // Real app: IPC → shell.openPath (hands off to Word / default viewer).
  alert(`Prototype: would hand "${file}" to the OS to open in its native app.`);
}

export function Topbar({
  submission,
  reveal,
  onToggleReveal,
}: {
  submission: Submission;
  reveal: boolean;
  onToggleReveal: () => void;
}) {
  return (
    <div className="rv-topbar">
      <span className="crumb">Cohort · {submission.cohortPosition} ‹</span>
      <h1>{submission.label}</h1>
      {submission.files.map((f) => (
        <button key={f.name} className="rv-filechip btn-open" onClick={() => openOriginal(f.name)}>
          {f.name}
        </button>
      ))}
      <span className="spacer" />
      <button className="btn" onClick={onToggleReveal}>
        {reveal ? "Hide estimate" : "Reveal estimate"}
      </button>
      <button className="btn" onClick={() => alert("Prototype: would export a marking sheet (CSV) to mark elsewhere.")}>
        Export sheet
      </button>
    </div>
  );
}

const LABELS: Record<Exclude<Stance, "unset">, string> = {
  agree: "Agree",
  disagree: "Disagree",
  adjust: "Adjust",
};

export function StanceButtons({
  value,
  onChange,
}: {
  value: Stance;
  onChange: (s: Stance) => void;
}) {
  return (
    <div className="stance">
      {(Object.keys(LABELS) as Array<Exclude<Stance, "unset">>).map((s) => (
        <button
          key={s}
          data-on={value === s ? s : undefined}
          onClick={() => onChange(value === s ? "unset" : s)}
        >
          {LABELS[s]}
        </button>
      ))}
    </div>
  );
}
