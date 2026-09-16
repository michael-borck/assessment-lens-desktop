/**
 * User settings — tiny JSON file in userData. Currently just the chosen local
 * model tier; main injects it into the sidecar env (restarting the sidecar on
 * change, since the engine reads the env at process start).
 */
import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

export interface Settings {
  ollamaModel?: string;
}

const file = () => path.join(app.getPath("userData"), "settings.json");

export function loadSettings(): Settings {
  try {
    return JSON.parse(fs.readFileSync(file(), "utf8")) as Settings;
  } catch {
    return {};
  }
}

export function saveSettings(patch: Partial<Settings>): Settings {
  const next = { ...loadSettings(), ...patch };
  fs.mkdirSync(path.dirname(file()), { recursive: true });
  fs.writeFileSync(file(), JSON.stringify(next, null, 2));
  return next;
}
