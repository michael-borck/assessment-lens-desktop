/**
 * Electron main — window, first-run setup, sidecar supervision, Ollama IPC,
 * auto-update. The renderer never touches Python: it talks to the sidecar's
 * localhost HTTP API (URL + token handed over via IPC) and drives setup/Ollama
 * through the channels below.
 */
import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { autoUpdater } from "electron-updater";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { parse as parseYaml } from "yaml";

import * as ollama from "./ollama";
import { installOllama, type InstallProgress } from "./ollama-install";
import { FirstRunPaths, isInstalled, runFirstRun, venvDir } from "./first-run";
import { loadSettings, saveSettings } from "./settings";
import { SidecarManager } from "./sidecar-manager";
// Bundled at build time (single source of truth shared with electron-builder).
import CONFIG from "../app.config.cjs";

const isDev = !app.isPackaged;
// Dev affordance: LENS_DEV_VENV=<path> reuses an existing engine venv (e.g. a
// checkout of assessment-lens with [serve,analysers] installed) instead of
// running the multi-minute first-run install.
const DEV_VENV = isDev ? process.env.LENS_DEV_VENV : undefined;
let win: BrowserWindow | null = null;
let sidecar: SidecarManager | null = null;

function paths(): FirstRunPaths {
  return {
    runtimeDir: path.join(app.getPath("userData"), "runtime"),
    // dev: out/main -> repo root; prod: packaged under resources/scripts.
    scriptsDir: isDev
      ? path.join(app.getAppPath(), "scripts")
      : path.join(process.resourcesPath, "scripts"),
  };
}

function createWindow(): void {
  win = new BrowserWindow({
    width: 1100,
    height: 760,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // preload needs limited node; renderer stays isolated
    },
  });
  // External links (e.g. ollama.com/download) open in the OS browser, never in
  // a new Electron window — a child window would inherit the preload bridge and
  // hand a remote page the sidecar IPC surface.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) void shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    const devUrl = process.env.ELECTRON_RENDERER_URL;
    const allowed = url.startsWith("file:") || (isDev && devUrl && url.startsWith(devUrl));
    if (!allowed) {
      e.preventDefault();
      if (url.startsWith("https:")) void shell.openExternal(url);
    }
  });

  // electron-vite serves the renderer in dev; loads the built file in prod.
  if (isDev && process.env.ELECTRON_RENDERER_URL) win.loadURL(process.env.ELECTRON_RENDERER_URL);
  else win.loadFile(path.join(__dirname, "../renderer/index.html"));
}

function send(channel: string, payload: unknown): void {
  win?.webContents.send(channel, payload);
}

/** The narrate/draft model env, from the user's persisted tier choice. */
function modelEnv(): NodeJS.ProcessEnv {
  const chosen = loadSettings().ollamaModel ?? CONFIG.ollama.defaultModel;
  return {
    ASSESSMENT_LENS_NARRATE_MODEL: chosen,
    ASSESSMENT_LENS_DRAFT_MODEL: chosen,
  };
}

/** Restart the sidecar so a new model choice takes effect immediately. */
async function restartSidecar(): Promise<void> {
  const p = paths();
  if (!sidecar) return;
  await sidecar.stop();
  sidecar = new SidecarManager({
    venvDir: DEV_VENV ?? venvDir(p),
    cwd: p.runtimeDir,
    serveCommand: CONFIG.serveCommand,
    healthPath: CONFIG.healthPath,
    defaultPort: CONFIG.defaultPort,
    authTokenEnv: CONFIG.authTokenEnv,
    extraEnv: { ...CONFIG.sidecarEnv, ...modelEnv() },
  });
  sidecar.on("status", (s) => send("sidecar:status", s));
  sidecar.on("log", (l: string) => send("sidecar:log", l));
  await sidecar.start();
}

/**
 * The router (auto-analyser) defaults every specialist to an HTTP service on
 * localhost:800x — a dev-machine convention. This app ships a fully-local
 * engine: write a config beside the sidecar's cwd that routes to the bundled
 * CLI members instead. Derived from app.config.sidecarPipSpecs so the two
 * never drift.
 */
function writeRouterConfig(dir: string): void {
  const members = CONFIG.sidecarPipSpecs
    .map((s) => s.split(/[[=]/)[0].trim())
    .filter((n) => n.endsWith("-analyser") && n !== "auto-analyser");
  const yaml = ["# Written by Assessment Lens — routes to the bundled local CLIs.", "analysers:", ...members.map((m) => `  ${m}: { type: cli, command: ${m} }`), ""].join("\n");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "auto-analyser.yaml"), yaml);
}

async function boot(): Promise<void> {
  const p = paths();

  // 1. First run: install the engine, streaming progress to the renderer modal.
  //    (Skipped entirely under LENS_DEV_VENV — see DEV_VENV above.)
  if (!DEV_VENV && !isInstalled(p)) {
    send("setup:phase", "installing");
    try {
      await runFirstRun(p, CONFIG.sidecarPipSpecs, CONFIG.models ?? [], (line) =>
        send("setup:log", line),
      );
    } catch (e) {
      send("setup:error", String(e));
      return;
    }
  }
  writeRouterConfig(p.runtimeDir);

  // 2. Start + supervise the sidecar.
  sidecar = new SidecarManager({
    venvDir: DEV_VENV ?? venvDir(p),
    cwd: p.runtimeDir,
    serveCommand: CONFIG.serveCommand,
    healthPath: CONFIG.healthPath,
    defaultPort: CONFIG.defaultPort,
    authTokenEnv: CONFIG.authTokenEnv,
    extraEnv: { ...CONFIG.sidecarEnv, ...modelEnv() },
  });
  sidecar.on("status", (s) => send("sidecar:status", s));
  sidecar.on("log", (l: string) => send("sidecar:log", l));
  try {
    await sidecar.start();
  } catch (e) {
    send("setup:error", String(e));
  }
}

/** Proxy a JSON request to the sidecar (renderer -> main -> sidecar): keeps the
 *  bearer token in main and sidesteps CORS. Returns {status, body}. */
function sidecarRequest(
  method: string,
  reqPath: string,
  body?: unknown,
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    if (!sidecar) return reject(new Error("engine not started"));
    const url = new URL(sidecar.url + reqPath);
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          Authorization: `Bearer ${sidecar.token}`,
          ...(payload ? { "Content-Type": "application/json" } : {}),
        },
      },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () => {
          let parsed: unknown = buf;
          try {
            parsed = JSON.parse(buf);
          } catch {
            /* non-JSON (e.g. empty) */
          }
          resolve({ status: res.statusCode ?? 0, body: parsed });
        });
      },
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function registerIpc(): void {
  ipcMain.handle("sidecar:status", () => sidecar?.status ?? { phase: "not-started" });
  ipcMain.handle("sidecar:request", (_e, method: string, p: string, body?: unknown) =>
    sidecarRequest(method, p, body),
  );
  // Manual restart (renderer offers it when the engine crashed or went offline).
  ipcMain.handle("sidecar:restart", async () => {
    try {
      await restartSidecar();
      return true;
    } catch (e) {
      send("setup:error", String(e));
      return false;
    }
  });
  ipcMain.handle("ollama:detect", () => ollama.detect());
  ipcMain.handle("ollama:pull", (_e, model: string) =>
    ollama.pull(
      model,
      Object.values(CONFIG.ollama.models).map((m) => (m as { id: string }).id),
      (prog) => send("ollama:progress", prog),
    ),
  );
  // One-off install of Ollama itself (per-OS), streaming progress to the card.
  ipcMain.handle("ollama:install", async () => {
    try {
      await installOllama((p: InstallProgress) => send("ollama:install-progress", p));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  });
  ipcMain.handle("app:config", () => {
    const totalMemGB = os.totalmem() / 1024 ** 3;
    return {
      productName: CONFIG.productName,
      ollama: { models: CONFIG.ollama.models, defaultModel: CONFIG.ollama.defaultModel },
      system: {
        platform: process.platform,
        totalMemGB: Math.round(totalMemGB),
        recommendedTier: totalMemGB >= 16 ? "large" : "small",
      },
      settings: loadSettings(),
    };
  });
  // Model choice: persist + restart the engine so narration uses it now.
  ipcMain.handle("settings:setModel", async (_e, modelId: string) => {
    const allowed = Object.values(CONFIG.ollama.models).map((m) => (m as { id: string }).id);
    if (!allowed.includes(modelId)) throw new Error(`non-curated model: ${modelId}`);
    saveSettings({ ollamaModel: modelId });
    await restartSidecar();
    return true;
  });
  // `win` can be null (macOS: all windows closed, app still running) — fall
  // back to the window-less dialog form instead of crashing on `win!`.
  ipcMain.handle("dialog:pickDir", async () => {
    const opts = { properties: ["openDirectory"] as "openDirectory"[] };
    const r = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts);
    return r.canceled ? null : r.filePaths[0];
  });
  ipcMain.handle("dialog:pickFile", async (_e, filters?: { name: string; extensions: string[] }[]) => {
    const opts = { properties: ["openFile"] as "openFile"[], filters };
    const r = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts);
    return r.canceled ? null : r.filePaths[0];
  });

  // --- Marking workflow -------------------------------------------------------
  // Rubric file → criterion list (+ optional per-criterion max_mark; the engine
  // ignores that key, so a rubric can carry it without breaking `assess`).
  ipcMain.handle("rubric:parse", (_e, rubricPath: string) => {
    const text = fs.readFileSync(rubricPath, "utf8");
    const doc: unknown = rubricPath.endsWith(".json") ? JSON.parse(text) : parseYaml(text);
    const d = (doc ?? {}) as Record<string, unknown>;
    const list = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
    const num = (v: unknown): number | null => (typeof v === "number" && v > 0 ? v : null);
    return {
      assignment: typeof d.assignment === "string" ? d.assignment : "Assessment",
      component: typeof d.component === "string" ? d.component : null,
      criteria: list(d.rubric).map((c, i) => ({
        id: String(c.id ?? `criterion-${i + 1}`),
        description: typeof c.description === "string" ? c.description : "",
        maxMark: num(c.max_mark),
      })),
      deliverables: list(d.expected_deliverables).map((x, i) => ({
        id: String(x.id ?? `deliverable-${i + 1}`),
        description: typeof x.description === "string" ? x.description : "",
      })),
    };
  });

  // Marks sheets: one JSON per run, keyed by a stable run key (renderer-built).
  const marksFile = (key: string) =>
    path.join(app.getPath("userData"), "marks", `${key.replace(/[^a-zA-Z0-9_-]/g, "")}.json`);
  ipcMain.handle("marks:load", (_e, key: string) => {
    try {
      return JSON.parse(fs.readFileSync(marksFile(key), "utf8"));
    } catch {
      return null;
    }
  });
  ipcMain.handle("marks:save", (_e, key: string, sheet: unknown) => {
    fs.mkdirSync(path.dirname(marksFile(key)), { recursive: true });
    fs.writeFileSync(marksFile(key), JSON.stringify(sheet, null, 2));
    return true;
  });

  // Last-run snapshot so a restart (or crash) resumes the cohort without a
  // re-run — the sidecar's run registry is in-memory and process-local.
  const lastRunFile = () => path.join(app.getPath("userData"), "last-run.json");
  ipcMain.handle("lastrun:load", () => {
    try {
      return JSON.parse(fs.readFileSync(lastRunFile(), "utf8"));
    } catch {
      return null;
    }
  });
  ipcMain.handle("lastrun:save", (_e, data: unknown) => {
    fs.writeFileSync(lastRunFile(), JSON.stringify(data));
    return true;
  });

  // Export: save dialog + write (renderer builds the CSV text).
  ipcMain.handle("export:csv", async (_e, defaultName: string, csv: string) => {
    const opts = { defaultPath: defaultName, filters: [{ name: "CSV", extensions: ["csv"] }] };
    const r = win ? await dialog.showSaveDialog(win, opts) : await dialog.showSaveDialog(opts);
    if (r.canceled || !r.filePath) return null;
    fs.writeFileSync(r.filePath, csv, "utf8");
    return r.filePath;
  });

  // Hand-off: open a submission folder (or any path) in the OS file manager.
  ipcMain.handle("open:path", (_e, p: string) => shell.openPath(p));
}

async function shutdown(): Promise<void> {
  if (sidecar) await sidecar.stop();
}

// Two instances would race the first-run install and double-spawn sidecars.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    registerIpc();
    void boot();
    if (!isDev) {
      setTimeout(() => autoUpdater.checkForUpdatesAndNotify().catch(() => {}), 30_000);
    }
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("before-quit", (e) => {
  e.preventDefault();
  void shutdown().finally(() => app.exit(0));
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
