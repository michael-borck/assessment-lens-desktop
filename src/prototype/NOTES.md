# Prototype — assessment-lens submission-review screen

**Question:** What should the single-submission review/drill-down screen look like —
the human-in-the-loop moment where an educator verifies signals (observations, not
grades), calibrates them, and assigns the mark?

**Throwaway.** Standalone, mock data only, no Electron/sidecar. Run:

```bash
npm run prototype      # opens http://localhost:5180/prototype.html?variant=A
```

Flip variants with the floating bottom bar or ← / → keys.

## The six directions (deliberately different layouts/philosophies)

- **A — Rubric ledger (criterion-first).** The rubric is the spine: a vertical list
  of criteria, each with its signals + inline evidence, agree/disagree/adjust per
  signal, and a per-criterion mark field. Estimate hidden until revealed. Good when
  the rubric structure is what the marker thinks in.
- **B — Document alongside signals (split view).** Left = extracted text summary;
  right = signal cards. Hovering a signal spotlights its evidence in the text — the
  "does this match what I'm reading?" sniff-test is the centre of gravity.
- **C — Triage queue (one signal at a time).** Decide on one observation at a time
  with big Agree/Disagree/Adjust actions + a progress bar, then a final tally + mark
  step. Lowest cognitive load, calibration-first.
- **D — Attention triage (by confidence).** Signals grouped by how much human
  attention they need ("needs attention" / "worth a look" / "looks consistent",
  the last collapsed). Spend time where the tool is least sure — the scale answer
  for big cohorts.
- **E — Cohort-relative compare.** This submission beside anonymised peers + the
  cohort norm; cells that stand out are flagged. Calibrate relatively, never as
  plagiarism/collusion. (Cohort-distinctiveness framing.)
- **F — Document timeline (by section).** Signals laid along the submission's own
  structure (Introduction → … → References) instead of by rubric — see *where*
  each observation occurs.
- **G — Cohort overview → drill into D (combines E + D).** The cohort is a
  row-per-student list SORTED BY ATTENTION (scales to 1000 — work the flagged top,
  not all N; filter/sort instead of scrolling). Click a student to drop into the
  individual attention-triage view (D); flagged signals there also show the
  cohort-relative context (E), e.g. "conclusion ~90 words · cohort median ~200".
  Back returns to the cohort. This is the leading direction per Michael
  (likes D + E; G is their synthesis).

All three express: observations-not-grades framing, cited evidence, agree/disagree/
adjust + reason, estimate hidden-by-default with a reveal toggle, final HITL mark or
"Export sheet", "Open original" hands off to the OS, and a "saved / calibration"
affordance.

## App-shell screens (the layers above the review workspace)

- **H — Unit dashboard.** Unit → assessments → runs. An assessment can have a
  group run + an individual run (each a separate signals pass over a folder);
  marks are collated per student afterwards. Export marks ± signals to CSV for the
  LMS. Framing is pattern-based ("read signals together"), not red-flag.
- **I — LMS ingestion.** The desktop's value-add over the Python package: a messy
  Canvas/Blackboard/Moodle export → unpack nested zips, drop OS junk, strip mangled
  filenames, MAP to the roster (with a preview), optional blind grading. Hands a
  clean folder to the engine; unmatched IDs are surfaced for review, not guessed.
- **J — Signal ↔ rubric mapping (iterative).** Many signals exist; map a SET to each
  criterion. Presets (Minimal / Balanced / All), add/remove per criterion, re-run.
  Embodies the loop: run all → skim → prune or add → re-run. Explicit that signals
  are read *in combination*, never one alone.

Principle held throughout: non-accusatory, observations-not-grades, human agency;
no single signal decides; ingestion lives in the app, the CLI assumes an arranged
folder.

## Verdict
_(to fill in after clicking through — which layout, and which bits to steal from the
others. The usual outcome is "the X from B with the Y from C".)_

## Cleanup
When a direction is chosen: fold the winner into the real review screen, then delete
`src/prototype/`, `src/prototype.html`, `vite.prototype.config.ts`, and the
`prototype` script in package.json.
