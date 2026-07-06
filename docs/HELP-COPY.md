# In-app help copy — Assessment Lens desktop

Draft copy for the app's help surfaces, derived from the position paper
(`assessment-lens/docs/position-paper.md` — rendered at `docs/position-paper.html`
on this site). Two kinds of surface:

1. **One Help screen** ("Why signals, not grades?") — reachable from the app menu
   (Help → Why signals, not grades?) and from a `?` affordance in the top bar.
2. **Contextual micro-help** — small popovers anchored to the specific UI element
   whose meaning needs defending, shown on a `?` icon or first use. These matter
   more than the Help screen: the estimate toggle and the cohort grouping are the
   politically sensitive spots (PRODUCT-PLAN §6, §3), and the explanation has to
   live *where the anxiety happens*.

Voice: plain, confident, no hedging, no marketing. Second person for the marker.
Every popover ends with the same escape hatch link: *Read the position paper →*
(opens `position-paper.html` in the system browser).

---

## 1. Help screen — "Why signals, not grades?"

**Title:** Why signals, not grades?

**Body:**

> Assessment Lens automates the *gathering of evidence* about student work. It
> never automates the *judgment* about what that evidence means.
>
> For every submission, the app computes **signals** — observable, deterministic
> properties of the work: readability indices, structural measures, complexity
> metrics, delivery pacing, and more, depending on what was submitted. Each
> signal is mapped to your rubric criteria, with its evidence cited. The same
> submission always yields the same signals.
>
> A signal is something detected that needs interpretation. A low readability
> score on a reflective essay might mean weak writing — or sophisticated
> technical vocabulary used well. The signal can't tell the difference. You can.
> That's why every mark in this app is entered by you.
>
> This split — machines identify evidence, humans judge it — isn't a hedge. It's
> the standard model in assessment research (Evidence-Centered Design, Mislevy
> et al., 2003), and the signals themselves rest on sixty years of measurement
> research, from Page (1966) to modern writing analytics.
>
> **What the app will never do:**
> - Assign a mark, grade, or score. The mark of record is always yours.
> - Rank students. Cohort views show where work sits in a distribution — a
>   prompt to look closer, never a league table.
> - Adapt what it shows based on previous marks. Your agree/disagree decisions
>   are kept for your own audit trail; they never change the signals.
> - Claim the signals are the whole story. Your own reading of the work
>   remains primary.
>
> *Read the position paper →*

---

## 2. Popover — signal pill (rubric × signal table, Student screen)

**Anchor:** any signal pill; also the "What's a signal?" link in the table header.

> **This is a signal, not a score.** An observable property of the submission,
> measured the same way for every student, with its evidence cited. Colour shows
> how notable the value is — not how good the work is. Read the signals for a
> criterion *together*; one alone rarely means much. You decide what they mean
> here.
>
> *Read the position paper →*

---

## 3. Popover — coverage flag (present / partial / absent)

**Anchor:** the coverage chip on an observation.

> **Coverage asks "is the evidence there?" — not "is it good?"** It is derived
> from thresholds on the signals: *present* means the evidence the criterion
> asks for was found, *partial* means some of it, *absent* means none was
> detected. Absent evidence is a place to look, not a deduction. Quality is
> your judgment.

---

## 4. Popover — the hidden mark estimate ("Why is this hidden?")

**Anchor:** next to the "Show estimate" toggle, before first reveal. This is the
most important popover in the app — show it the first time the toggle is used.

> **Hidden on purpose.** Research on judgment is blunt about anchoring: a number
> you see before you decide pulls your decision toward it. So the estimate stays
> out of sight until you ask.
>
> When you reveal it, you're seeing a transparent weighting of the signals
> through your rubric mapping — click it to see exactly which signals contribute
> and how. It is a reference point to compare against your own judgment, not a
> recommendation. It is never recorded anywhere as the mark. The mark of record
> is the one you enter.
>
> *Read the position paper →*

---

## 5. Popover — cohort patterns (Cohort screen header)

**Anchor:** `?` beside the pattern legend (Polarised / Consistently low /
Consistently high / Even).

> **Grouping, not ranking.** These groups order your attention, not your
> students: polarised profiles are worth understanding first; consistently high
> or low profiles are worth confirming; even profiles are usually the bulk. The
> bars show signal strength per criterion — where the work sits in this cohort's
> distribution, never a verdict on it. Distinctive or similar is a prompt to
> look, not a finding.

---

## 6. Popover — feedback comments (Student screen)

**Anchor:** the feedback panel header, or each comment's cite icon.

> **Every comment is grounded.** Feedback lines are built from the signals —
> click one to see the evidence behind it. If a comment doesn't match your
> reading of the work, edit it or drop it: the signals are pre-reading notes
> from a tireless colleague, not that colleague's opinion.

---

## 7. Micro-copy already in the app (keep, for consistency)

- Dashboard banner: "Signals are observations to read **together** — one alone
  rarely means much. You assign every mark." — keep verbatim; the popovers above
  are written to echo its phrasing.
- Cohort pattern notes ("…worth understanding", "confirm it's really low") —
  keep; same neutral-prompt framing.

## Implementation notes (when the next slice lands)

- The Help screen is static content — a fourth `Screen` ("help") in `nav.tsx`
  or a modal from the top bar; no data dependencies.
- "Read the position paper →" should open the hosted page
  (`https://michael-borck.github.io/assessment-lens-desktop/position-paper.html`)
  via `shell.openExternal`, falling back to a bundled copy when offline.
- Popovers 2–6 anchor to elements that arrive with the Student-screen slice
  (rubric × signal table, estimate toggle, feedback panel); popover 5 can ship
  now against `Cohort.tsx`'s legend.
