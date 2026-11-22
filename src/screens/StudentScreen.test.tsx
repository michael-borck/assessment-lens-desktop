import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RubricInfo } from "../../global";
import type { MarkSheet, SubmissionResult } from "../types";
import { StudentScreen } from "./StudentScreen";

const criteria = [
  { id: "critical-thinking", max: 40 },
  { id: "communication", max: 20 },
];

const rubric: RubricInfo = {
  assignment: "Data-Viz Project",
  component: "individual",
  criteria: [
    { id: "critical-thinking", description: "Evidence of critical engagement", maxMark: 40 },
    { id: "communication", description: "Clarity of writing", maxMark: 20 },
  ],
  deliverables: [],
};

const sub: SubmissionResult = {
  submission_id: "alice",
  error: "",
  deliverables: [],
  distinctiveness: null,
  observations: [
    {
      criterion_id: "critical-thinking",
      evidence: [{ signal: "conversation.critical_thinking", value: 0.7 }],
      note: "Two counter-arguments with cited sources.",
      coverage: "present",
      coverage_source: "threshold",
    },
    {
      criterion_id: "communication",
      evidence: [],
      note: "No observation yet.",
      coverage: null,
      coverage_source: "suggested",
    },
  ],
};

const sheet: MarkSheet = {
  version: 1,
  key: "k",
  assignment: "Data-Viz Project",
  criteria,
  students: {
    alice: {
      marks: { "critical-thinking": 32, communication: null },
      strengths: "",
      improvements: "",
      overall: "",
      finalised: false,
      updatedAt: "t",
    },
  },
};

function renderScreen(onChange = vi.fn()) {
  return render(
    <StudentScreen
      sub={sub}
      rubric={rubric}
      criteria={criteria}
      sheet={sheet}
      onChange={onChange}
      onClose={() => {}}
      onPrev={() => {}}
      onNext={() => {}}
      position="1 of 2"
      submissionsPath="/tmp/subs"
    />,
  );
}

beforeEach(() => {
  (window as unknown as { lens: unknown }).lens = { openPath: vi.fn().mockResolvedValue("") };
});

describe("StudentScreen", () => {
  it("shows the student, the cited evidence, and the coverage label", () => {
    renderScreen();
    expect(screen.getByRole("heading", { name: "alice" })).toBeInTheDocument();
    expect(screen.getByText("conversation.critical_thinking")).toBeInTheDocument();
    expect(screen.getByText("evidence present")).toBeInTheDocument();
    expect(screen.getByText(/no observation/)).toBeInTheDocument();
  });

  it("shows the saved mark against the criterion maximum", () => {
    renderScreen();
    const input = screen.getByLabelText("Your mark / 40") as HTMLInputElement;
    expect(input).toHaveValue(32);
  });

  it("reports entered totals and how many criteria are marked", () => {
    const { container } = renderScreen();
    expect(container.querySelector(".total")?.textContent).toBe(
      "32 / 60 entered · 1/2 criteria marked",
    );
  });

  it("emits an updated mark when the marker edits the field", () => {
    const onChange = vi.fn();
    renderScreen(onChange);
    fireEvent.change(screen.getByLabelText("Your mark / 40"), { target: { value: "35" } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].marks["critical-thinking"]).toBe(35);
  });

  it("clamps an out-of-range mark to the criterion maximum", () => {
    const onChange = vi.fn();
    renderScreen(onChange);
    fireEvent.change(screen.getByLabelText("Your mark / 40"), { target: { value: "999" } });
    expect(onChange.mock.calls[0][0].marks["critical-thinking"]).toBe(40);
  });

  it("lets the marker finalise the student", () => {
    const onChange = vi.fn();
    renderScreen(onChange);
    fireEvent.click(screen.getByLabelText("Finalised"));
    expect(onChange.mock.calls[0][0].finalised).toBe(true);
  });
});