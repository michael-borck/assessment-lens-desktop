# Assessment Lens (desktop) — product plan

Working plan (2026-06). Supersedes the design notes in
`~/Projects/lens/assessment-rename-and-ux-plan.md §4`; that file still holds the
family-level naming decisions (assessment-lens is a product, not an engine; no
rename; no monorepo). The interactive prototype lives in `src/prototype/`
(`npm run prototype`, variants A–J) and feeds the screens below.

## 1. What it is
A desktop app for educators that turns the lens/analyser family's many automated
**signals** into a manageable, human-in-the-loop marking workflow. The app ingests
a messy LMS export, runs signals against a rubric, and lets a lecturer triage a
cohort, dig into any student, and own every mark and comment. The Python
`assessment-lens` package is the engine; this app is its GUI (the other UI is the
CLI). Ingestion + provider config + the review UX are the app's value-add.

## 2. Principles (non-negotiable — they shape every screen)
- **Observations, not grades.** Signals describe; the human decides. The mark is
  the lecturer's.
- **Process, not accusation.** Never "red flags" / "detection" / misconduct. An
  unconfirmed or unusual signal is neutral context, surfaced for a human to
  interpret. "Improvements" feedback is framed as a learning opportunity.
- **No single signal decides.** The family returns *many* signals; meaning comes
  from the **combination** (high here + low there) and from a set's
  **distinctiveness** vs the cohort. The UI surfaces patterns, not lone alarms.
- **Human agency / LLM drafts, human owns.** Where an LLM is used (mapping,
  feedback, mark justification) it produces an *editable draft grounded in
  signals*; the lecturer approves/edits/rejects. The mark estimate stays
  **hidden by default**.
- **Private by design.** Local-first (Ollama). Cloud LLMs are opt-in with an
  explicit "student work leaves your machine" warning (see §8).

## 3. Information architecture (the levels + overlays)
```
Units ─▸ Unit ─▸ Assessment ─▸ Cohort list ─▸ Student review
                    │                              │
              setup: ingest →                overlays: signal detail ·
              map signals → run              criterion detail · mark
                                             justification · feedback justification
```
- **Units / Unit** — a lecturer manages multiple units; each has multiple
  assessments. (Prototype: dashboard **H**.)
- **Assessment** — its run(s), config (rubric, signal→criterion mapping, mode),
  and the cohort. An assessment may be a single run, or a **group run + an
  individual run** that are **collated** into a per-student mark afterwards.
- **Cohort list (level 1)** — row per student with a **coarse per-criterion
  signal-strength rollup** (e.g. a small bar/pill per criterion). The point is to
  read the *shape across criteria* at a glance and spot three patterns:
  **consistently high** (likely distinction), **consistently low** (failing /
  very average), and **polarity** (strong on some, weak on others). The lecturer
  decides where to dig: is the low really low, the high really that good, and what
  *explains* a polarised profile (an uneven-but-genuine skill set, a data quirk,
  or something to ask the student about — framed neutrally, never "suspicious").
  Sortable/groupable by pattern; scales because you work by shape, not row-by-row.
  (Prototype: **G**, to be extended with the rollup.)
- **Student review (level 2)** — a **rubric × signal table**: each criterion row
  shows its mapped signals as **colour-coded pills** (colour = strength/notability
  for this student) with a short strength note. Plus the three feedback comments
  and the (hidden-by-default) mark estimate. (Refines prototype **D/B**.)
- **Overlays (level 3):**
  - Click a **signal pill** → overlay with that signal's evidence + value.
  - Click a **criterion** → all signals contributing to it, together.
  - Click the **mark** (if revealed) → justification + the signals supporting it.
  - Click a **feedback** line → the signals supporting that comment.

## 4. Signal → rubric mapping (LLM-assisted, human-approved)
There are many signals, so mapping a relevant **set** to each rubric criterion is
core, and **iterative**: run all → skim → prune or add → re-run; or start minimal
and add signals if the marks don't separate. (Prototype: **J**.)
- **LLM proposes an initial mapping** from the available signals to the rubric
  (this is the engine's existing `draft-rubric`-style capability). The lecturer
  **approves / edits / rejects** per criterion.
- Presets (Minimal / Balanced / All); add/remove signals per criterion; re-run.
  Fewer signals = nothing extra to compute; adding re-runs only the new ones.

## 5. Feedback (per student)
Three comments, **one sentence each, max**:
- **Strengths** · **Improvements** (weakness framed as a learning opportunity) ·
  **Overall**.
- **Templated from the signals by default** (zero-config, instant, private, fully
  offline — see §8). Optionally LLM-polished for more fluent prose. Lecturer-editable.
- Click any comment → the **signals supporting it** (overlay). Grounded, not vibes.

## 6. Mark estimate + justification
- **Derived from the signals** (a transparent weighting via the rubric mapping) —
  NOT LLM-judged. This makes the justification trivial (it *is* the contributing
  signal values) and keeps the whole thing defensible.
- **Hidden by default** (anchoring + AI-marking sensitivity); reveal toggle.
- It is explicitly a **guess.** The lecturer has the final say and may read a
  single signal — or a combination — differently. Click the revealed mark →
  justification + supporting signals; the human enters the final mark.

## 7. Roster (preferred, never a gate)
- Best: upload a roster (maps IDs → names, enables blind grading, clean export).
- Otherwise: **extract identities from the submissions** (IDs in filenames), and
  allow a roster upload **later** to backfill names — or run with no roster at all
  (IDs only). The tool must be fully usable without a roster.

## 8. LLM — an OPTIONAL language layer (NOT for signals or the mark)
The core is deterministic and works with **no LLM at all**: signals come from the
analysers, the mark estimate is computed from the signal→rubric weighting (§6), and
the justification is templated from the contributing signal values. The LLM only
turns structured data into natural language, and is always optional:
- **Feedback wording** — phrase the three one-sentence comments from the signals.
  (A template does this LLM-free; the LLM just reads more naturally.)
- **Initial signal→rubric mapping suggestion** — semantic match of rubric language
  to signal descriptions, which the lecturer approves/edits. (Manual mapping needs
  no LLM.)
A **small local model is plenty** for both. The app is fully usable LLM-off.

**Embedding a model in the app (so there's no Ollama to install)?** Technically
yes — `node-llama-cpp` (in-process GGUF) or transformers.js/WebLLM (WASM/WebGPU) +
a tiny quantised model. But it carries real cost: a fat installer (~0.5–2 GB) or a
first-run model download, per-OS native binaries that complicate signing/notarize,
and runtime RAM. For *this* task — three one-sentence comments from structured
signal values — a **good template engine (varied phrasings, composition rules)
likely reads "human enough" with none of that cost**, and the lecturer edits anyway.
So: **templated default = the true zero-config, no-Ollama path** (no model needed at
all). Treat an embedded small model as an optional later tier *if* templates read
flat; external providers (Ollama/cloud) remain the "I want max fluency" tier.

Providers (Settings; calls routed through the engine, already multi-provider):
**Ollama (local, default)**, remote Ollama + bearer key, the lecturer's **own
VPS/endpoint**, OpenAI, Gemini, Anthropic, OpenRouter / generic OpenAI-compatible.
It's their machine and their data — **not ours to police.** We default to local and
don't gate cloud providers; we just show a one-line disclaimer to check
institutional data/AI policy.

## 9. Export / download
Per assignment, downloadable per student (and as a cohort bundle):
- all **signals** (raw values + evidence),
- the **mark estimate** + its **justification**,
- the three **feedback** comments + the **signals justifying each**.
Formats: a **marks-only CSV** (for LMS upload) and a **full bundle** (CSV/JSON with
signals + justifications, for records/merging). Collated group+individual marks
included where applicable.

## 10. Build sequence (phased)
1. **App shell + navigation** (Units → Unit → Assessment → Cohort → Student),
   wired to the engine via the local `serve` sidecar; mock first, then real.
2. **Ingestion** (LMS export → roster mapping; prototype I) — roster optional.
3. **Signal→rubric mapping** (prototype J) + **LLM draft mapping** (engine).
4. **Student review table + overlays** (signal / criterion / mark / feedback).
5. **Feedback** (engine narration) + **mark estimate/justification** (hidden default).
6. **Export** (marks CSV + full bundle).
7. **Settings: LLM providers** (local-first, cloud opt-in).
8. **Group/individual collation**.
Design throughout: modern, professional, calm (it's a long-session grading tool) —
neutral palette, strong typography, generous density; never alarmist.

## 11. Decisions
1. **Mark estimate** — RESOLVED: **signal-derived / transparent**, human overrides.
   LLM not used for the number; estimate is a guess the lecturer can reinterpret.
2. **Cloud LLM** — RESOLVED: **not gated**; local Ollama default; one-line policy
   disclaimer. It's the lecturer's own machine and data.
3. **LLM home** — engine (`draft-rubric` + narration + existing multi-provider);
   desktop only configures the provider + owns the approve/edit UI.
4. **LLM scope** — RESOLVED: **optional language layer only** (feedback prose +
   mapping suggestion). Core is deterministic and LLM-free; the app runs with no
   LLM (templated feedback, manual/heuristic mapping). LLM is an enhancement, so
   it can be deferred past v1.
5. **Cohort-list aggregate** — RESOLVED: **coarse per-criterion signal-strength
   rollup**, designed to surface consistently-high / consistently-low / polarised
   shapes; sortable by pattern.
6. **Feedback generation** — RESOLVED: **templated by default** (zero-config, no
   Ollama needed). Embedded small model considered but deferred (cost > benefit for
   one-line comments); optional LLM polish via providers later.

## 12. assessment-bench vs assessment-lens (re: the LLM)
The two tools use the LLM *oppositely on purpose*: the **lens never lets the LLM
mark** (estimate is signal-derived; LLM is language-only). **bench deliberately has
an LLM-marking arm** — because measuring how LLM marks compare to signal-based
observations and to human marks *is the experiment*. So bench's LLM scores are
research data points (covered by student consent), not grades; there's no conflict
with the lens's principle — they're answering different questions.
