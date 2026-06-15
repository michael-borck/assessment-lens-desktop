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

Download the installer for your OS from Releases and run it. **First launch** sets
up the local engine (a one-time, several-minute download — shown with progress);
after that it starts instantly and works offline.

For narration, install [Ollama](https://ollama.com/download); the app guides you
through pulling a model the first time.

## How it works

```
Electron UI ─IPC─ main ─┬─ spawns the assessment-lens `serve` sidecar (local venv)
                        │     ◄─ localhost HTTP (proxied; token in main) ─►
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

Scaffolded from the template and **verified to build** (typecheck + electron-vite
build). The full first-run install + live GUI run still need per-OS verification
(see the family [desktop design doc](https://michael-borck.github.io/lens-analysers/docs/DESKTOP-APPS-DESIGN.html)).
Note: `app.config.cjs` installs `assessment-lens` from PyPI on first run — it needs
the **0.4.0 release** (HTTP API + local provider), not yet published at time of
scaffolding.
