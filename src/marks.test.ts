import { describe, expect, it } from "vitest";
import {
  buildMarksCsv,
  classifyPattern,
  coverageBand,
  criterionCoverages,
  emptyStudent,
  enteredTotal,
  markedCount,
  maxTotal,
  reconcileSheet,
  runKey,
  studentMarks,
  summarise,
} from "./marks";
import type { AssessmentResult, MarkSheet, StudentMarks, SubmissionResult } from "./types";

const criteria = [
  { id: "critical-thinking", max: 40 },
  { id: "communication", max: 20 },
];

function sub(id: string, coverages: ("present" | "partial" | "absent")[]): SubmissionResult {
  return {
    submission_id: id,
    error: "",
    deliverables: [],
    distinctiveness: null,
    observations: criteria.map((c, i) => ({
      criterion_id: c.id,
      evidence: [{ signal: "test.signal", value: 1 }],
      note: "n",
      coverage: coverages[i] ?? null,
      coverage_source: "threshold",
    })),
  };
}

function sheetWith(marks: Record<string, number>): MarkSheet {
  return {
    version: 1,
    key: "k",
    assignment: "A",
    criteria,
    students: {
      alice: { marks, strengths: "", improvements: "", overall: "", finalised: false, updatedAt: "t" },
    },
  };
}

describe("runKey", () => {
  it("is stable for the same paths and differs when either changes", () => {
    expect(runKey("/r.yaml", "/subs")).toBe(runKey("/r.yaml", "/subs"));
    expect(runKey("/r.yaml", "/subs")).not.toBe(runKey("/r2.yaml", "/subs"));
    expect(runKey("/r.yaml", "/subs")).not.toBe(runKey("/r.yaml", "/subs2"));
  });
});

describe("emptyStudent / reconcileSheet / studentMarks", () => {
  it("creates null marks for every criterion", () => {
    const m = emptyStudent(criteria);
    expect(m.marks).toEqual({ "critical-thinking": null, communication: null });
    expect(m.finalised).toBe(false);
  });

  it("fills missing criterion keys without clobbering saved marks", () => {
    const sheet = sheetWith({ "critical-thinking": 30 });
    const next = reconcileSheet(sheet, [...criteria, { id: "new", max: 10 }]);
    expect(next.students.alice.marks["critical-thinking"]).toBe(30);
    expect(next.students.alice.marks.new).toBeNull();
  });

  it("returns a blank student for an unknown id", () => {
    const m = studentMarks(sheetWith({}), "nobody");
    expect(m.marks).toEqual({ "critical-thinking": null, communication: null });
  });
});

describe("coverage / totals", () => {
  it("maps coverage to bands", () => {
    expect(coverageBand("present")).toBe("high");
    expect(coverageBand("partial")).toBe("mid");
    expect(coverageBand("absent")).toBe("low");
    expect(coverageBand(null)).toBe("none");
  });

  it("sums only entered marks and counts criteria marked", () => {
    const m: StudentMarks = {
      marks: { "critical-thinking": 30, communication: null },
      strengths: "",
      improvements: "",
      overall: "",
      finalised: false,
      updatedAt: "t",
    };
    expect(enteredTotal(m, criteria)).toBe(30);
    expect(maxTotal(criteria)).toBe(60);
    expect(markedCount(m, criteria)).toBe(1);
  });
});

describe("classifyPattern", () => {
  it("flags polarised work and consistently low/high work", () => {
    expect(classifyPattern(sub("a", ["present", "absent"]), criteria.map((c) => c.id))).toBe(
      "polarised",
    );
    expect(classifyPattern(sub("b", ["absent", "absent"]), criteria.map((c) => c.id))).toBe("low");
    expect(classifyPattern(sub("c", ["present", "present"]), criteria.map((c) => c.id))).toBe(
      "high",
    );
    expect(classifyPattern(sub("d", ["partial", "partial"]), criteria.map((c) => c.id))).toBe(
      "even",
    );
  });

  it("returns each criterion's coverage in rubric order", () => {
    const covs = criterionCoverages(sub("a", ["present", "absent"]), ["communication", "critical-thinking"]);
    expect(covs).toEqual(["absent", "present"]);
  });
});

describe("buildMarksCsv", () => {
  it("emits a header row and one row per submission", () => {
    const sheet = sheetWith({ "critical-thinking": 30, communication: 15 });
    const csv = buildMarksCsv(sheet, [sub("alice", ["present", "present"])]);
    const [header, row] = csv.trimEnd().split("\r\n");
    expect(header).toBe(
      "submission_id,total,critical-thinking,communication,marked,finalised,strengths,improvements,overall",
    );
    expect(row).toBe("alice,45,30,15,2/2,,,,");
  });

  it("neutralises spreadsheet formulas in user text", () => {
    const sheet = sheetWith({ "critical-thinking": 1 });
    sheet.students.alice.strengths = "=HYPERLINK(\"http://evil\")";
    const csv = buildMarksCsv(sheet, [sub("alice", ["present", "absent"])]);
    expect(csv).toContain("'=HYPERLINK");
  });
});

describe("summarise", () => {
  it("counts failed analyses", () => {
    const result: AssessmentResult = {
      assignment: "A",
      component: null,
      submissions: [sub("alice", ["present", "present"]), { ...sub("bob", []), error: "boom" }],
    };
    expect(summarise(result)).toBe("2 submissions (1 failed analysis)");
  });
});