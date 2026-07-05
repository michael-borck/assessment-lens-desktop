// PROTOTYPE — throwaway mock data for the submission-review screen design.
// Not wired to the sidecar; delete when a variant is chosen.

export interface Evidence {
  quote: string;
  locator: string; // e.g. "Discussion ¶2", "References", "00:04:12"
}

export type Stance = "unset" | "agree" | "disagree" | "adjust";

export interface Signal {
  id: string;
  observation: string; // neutral, observation-framed — never a grade or accusation
  evidence: Evidence[];
  source: string; // which analyser produced it
}

export interface Criterion {
  id: string;
  title: string;
  descriptor: string;
  maxMark: number;
  estimate: number; // hidden by default
  signals: Signal[];
}

export interface Submission {
  label: string; // anonymised
  cohortPosition: string; // e.g. "14 of 31"
  files: { name: string; kind: string }[];
  summary: string; // extracted-text summary (the sniff-test material)
  criteria: Criterion[];
}

export const SUBMISSION: Submission = {
  label: "Submission 14 · Group C",
  cohortPosition: "14 of 31",
  files: [
    { name: "report.docx", kind: "document" },
    { name: "demo.mp4", kind: "video" },
  ],
  summary:
    "The report opens by framing student over-reliance on AI tutors, citing Bastani et al. and Buçinca et al. " +
    "It argues that lightweight “forcing functions” can prompt reflection without heavy scaffolding. " +
    "The methodology section describes a small observational study (n=24) run over one semester, with engagement " +
    "coded from chat transcripts. The discussion acknowledges that the observational design limits causal claims " +
    "and proposes a follow-up randomised trial to address it. The conclusion is brief and restates the main " +
    "finding without overclaiming. A recorded demo walks through the prototype nudge in a live tutoring session.",
  criteria: [
    {
      id: "critical",
      title: "Critical engagement",
      descriptor: "Evidence of analysis, weighing alternatives, and acknowledging limits.",
      maxMark: 10,
      estimate: 7,
      signals: [
        {
          id: "c1",
          observation:
            "Engages with the limits of its own method — notes the observational design cannot establish causation and proposes a randomised follow-up.",
          source: "reflection-analyser · depth",
          evidence: [
            {
              quote:
                "the observational design limits causal claims and proposes a follow-up randomised trial to address it",
              locator: "Discussion ¶2",
            },
          ],
        },
        {
          id: "c2",
          observation:
            "Claims are mostly attributed to sources rather than asserted directly.",
          source: "conversation-analyser · critical_thinking",
          evidence: [
            { quote: "citing Bastani et al. and Buçinca et al.", locator: "Introduction ¶1" },
          ],
        },
      ],
    },
    {
      id: "sources",
      title: "Use of sources",
      descriptor: "Sources exist, are relevant, and are cited consistently.",
      maxMark: 10,
      estimate: 8,
      signals: [
        {
          id: "s1",
          observation:
            "11 references found; 10 verified against academic databases. 1 could not be confirmed (a lookup was unavailable — not a confirmed miss).",
          source: "cite-sight · reference verification",
          evidence: [
            { quote: "Borck, M. (2026a). Conversation, not delegation: How to think with AI.", locator: "References" },
          ],
        },
        {
          id: "s2",
          observation: "Every in-text citation matches an entry in the reference list.",
          source: "cite-sight · cross-reference",
          evidence: [
            { quote: "(Bastani et al., 2024) … (Buçinca et al., 2021)", locator: "throughout" },
          ],
        },
      ],
    },
    {
      id: "structure",
      title: "Structure & clarity",
      descriptor: "Logical structure; readable, appropriately pitched prose.",
      maxMark: 10,
      estimate: 6,
      signals: [
        {
          id: "t1",
          observation:
            "Readability is consistent across sections (reading grade ~13); the conclusion is markedly shorter than the other sections.",
          source: "document-analyser · readability variance",
          evidence: [
            { quote: "The conclusion is brief and restates the main finding without overclaiming.", locator: "Conclusion" },
          ],
        },
      ],
    },
  ],
};

export const SIGNAL_COUNT = SUBMISSION.criteria.reduce((n, c) => n + c.signals.length, 0);

// ---- Cohort overview mock (Variant G) ----
export interface CohortRow {
  id: string;
  label: string;
  strength: number[]; // 0–100 per criterion, aligned to COHORT_CRITERIA
  reviewed: boolean;
}

export const COHORT_CRITERIA = ["Critical", "Sources", "Structure"];
export const COHORT_TOTAL = 240; // implies scale; the list shows a sorted/filtered slice

export const COHORT: CohortRow[] = [
  { id: "s47", label: "Submission 47 · Group H", strength: [20, 18, 30], reviewed: false },
  { id: "s22", label: "Submission 22 · Group F", strength: [90, 28, 35], reviewed: false },
  { id: "s09", label: "Submission 09 · Group B", strength: [35, 30, 88], reviewed: false },
  { id: "s38", label: "Submission 38 · Group E", strength: [55, 88, 25], reviewed: false },
  { id: "s14", label: "Submission 14 · Group C", strength: [85, 85, 42], reviewed: false },
  { id: "s28", label: "Submission 28 · Group D", strength: [62, 40, 58], reviewed: false },
  { id: "s06", label: "Submission 06 · Group A", strength: [70, 72, 68], reviewed: true },
  { id: "s31", label: "Submission 31 · Group D", strength: [60, 58, 64], reviewed: true },
  { id: "s52", label: "Submission 52 · Group H", strength: [48, 52, 50], reviewed: false },
  { id: "s03", label: "Submission 03 · Group A", strength: [88, 90, 86], reviewed: true },
  { id: "s11", label: "Submission 11 · Group B", strength: [92, 85, 90], reviewed: false },
  { id: "s17", label: "Submission 17 · Group C", strength: [55, 60, 58], reviewed: true },
  { id: "s23", label: "Submission 23 · Group F", strength: [33, 38, 30], reviewed: false },
  { id: "s35", label: "Submission 35 · Group E", strength: [60, 55, 62], reviewed: false },
  { id: "s41", label: "Submission 41 · Group G", strength: [85, 88, 82], reviewed: true },
  { id: "s44", label: "Submission 44 · Group G", strength: [50, 52, 48], reviewed: false },
];

// Cohort-relative context shown on the flagged signals inside the drill-in (fuses E into D).
export const COHORT_CONTEXT: Record<string, string> = {
  s1: "10/11 verified · cohort median 9/10",
  t1: "conclusion ~90 words · cohort median ~200",
};
