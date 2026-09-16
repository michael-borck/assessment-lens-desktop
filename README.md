# Assessment Lens (desktop)

Mark a cohort with the analyser family — as **observations, not grades**. Pick a
folder of submissions and a rubric; the app analyses each submission and shows
cited evidence per criterion, deliverable checks, and how each submission sits in
the cohort. **You assign every mark.**

**Private by design.** Everything runs on your machine: analysis happens in a
local engine, and narration uses a **local LLM (Ollama)** — student work never
leaves the computer, and the app works offline once set up.

> Built from the [`lens-desktop`](https://github.com/michael-borck/lens-desktop)
> template. Wraps [`assessment-lens`](https://github.com/michael-borck/assessment-lens)'s
> `serve` HTTP API as a bundled Python sidecar.

## Install & run

Download the installer for your OS from Releases and run it (macOS dmg, Windows
NSIS, Linux AppImage/deb — built by GitHub Actions on `v*` tags). **First launch**
sets up the local engine (a one-time, several-minute download — shown with
progress); after that it starts instantly and works offline.

For narration, the app offers a **one-off in-app install of Ollama**, then a
model sized for the machine — **Qwen3.5 2B** by default, **4B** recommended on
16 GB+ RAM (IDs curated in `app.config.cjs`). Skipping it is fine: everything
except AI narration works without it.

## Use it

1. **Choose rubric…** — a structured YAML (the `assessment-lens` rubric format;
   optional `max_mark:` per criterion is honoured by the app).
2. **Choose submissions folder…** — one subfolder per student/group.
3. **Assess cohort** → progress → the cohort screen groups submissions by shape
   (polarised / consistently low / high / even) so you work attention-first.
4. Click a student → per-criterion observations with cited evidence, your mark
   per criterion, three feedback comments, cohort-relative context, "Open
   original" hand-off. Marks autosave locally.
5. **Export marks CSV…** for the LMS (per-criterion marks, total, comments).

Close and reopen any time — the app offers to resume the last cohort (marks
included) without re-running the analysis. Failed submissions get a one-click
re-run; the app works fully offline; narration (optional) uses local Ollama.

## What it can assess

Files route automatically by extension (via `auto-analyser`) to the analyser
bundled for them:

| Submission type | Extensions | Analyser |
|---|---|---|
| Documents | `.pdf` `.docx` `.pptx` `.txt` `.md` `.qmd` `.rst` | document-analyser |
| Code | `.py` `.js` `.ts` `.tsx` `.jsx` `.html` `.css` `.scss` `.sql` `.ipynb` | code-analyser |
| Video | `.mp4` `.mov` `.avi` `.webm` `.mkv` | video-analyser |
| Audio | `.mp3` `.wav` `.m4a` `.ogg` `.flac` `.aac` `.opus` | speech-analyser |
| Spreadsheets / data | `.xlsx` `.csv` `.tsv` `.json` `.yaml` `.xml` … | records-analyser |
| Images | `.png` `.jpg` `.gif` `.bmp` `.tiff` `.webp` | image-analyser |
| Diagrams | `.mmd` `.mermaid` `.puml` `.plantuml` `.dot` `.gv` `.drawio` | diagram-analyser |
| AI-chat transcripts, reflective journals | pinned via the rubric's `signals_of_interest` | conversation- / reflection-analyser (explicit-only) |

New analysers are plugins: write one against the family contract (a `manifest`
plus `<command> <file> --json` → JSON on stdout), add it to `sidecarPipSpecs`
in `app.config.cjs`, and routing + the rubric's signal paths pick it up — no
app changes.

## How it works

```
Electron UI ─IPC─ main ─┬─ spawns the assessment-lens `serve` sidecar (local venv)
                        │     ◄─ localhost HTTP (proxied; token in main) ─►
                        ├─ writes auto-analyser.yaml (CLI-mode routing) beside it
                        └─ detects Ollama for local narration
```

The renderer never touches Python — it calls the sidecar's HTTP API through the
main process. See `app.config.cjs` for the one place this app configures itself
(pip spec, serve command, curated model).

## Develop

```bash
npm install
npm run dev      # electron-vite dev
npm run package  # build + electron-builder installers
```

## Status

**v0.2 — the marking workflow is real.** Setup → run → cohort triage → student
review (per-criterion marks + comments) → marks-CSV export, wired to the
`assessment-lens` sidecar end-to-end (verified against a live engine run), with
local marks persistence + resume-after-restart. The `src/app/` + `src/prototype/`
folders hold the earlier mock shell / prototype variants (unused by the live
entry). Deferred per the [product plan](docs/PRODUCT-PLAN.md): units/assessments
hierarchy, LMS ingestion, signal→rubric mapping UI, cloud providers, group/individual
collation. Still needs per-OS installer verification (see the family
[desktop design doc](https://michael-borck.github.io/lens-analysers/docs/DESKTOP-APPS-DESIGN.html)).
`app.config.cjs` installs `assessment-lens==0.5.2` from PyPI on first run.
