import { useEffect, useState } from "react";
import type { AppConfig, OllamaModelTier } from "../../global";

/**
 * Local AI setup — three phases, each opt-in:
 *   1. Ollama not running → one-off in-app install (per-OS) with progress, or
 *      the manual route (ollama.com) for those who prefer it.
 *   2. Running but no curated model → pick a tier sized for the machine
 *      (2B default on ≤16 GB, 4B on 16 GB+), pulled in-app with progress.
 *   3. Ready → shows which model the engine narrates with.
 * The app is fully usable without any of this (narration just stays off).
 */

type Phase =
  | { kind: "checking" }
  | { kind: "not-running" }
  | { kind: "installing"; status: string; percent: number | null }
  | { kind: "choose" }
  | { kind: "pulling"; tier: string; status: string; percent: number | null }
  | { kind: "ready"; models: string[] }
  | { kind: "error"; message: string };

function tierFor(models: Record<string, OllamaModelTier>, id: string): OllamaModelTier | null {
  return Object.values(models).find((m) => m.id === id) ?? null;
}

export function OllamaSetupCard() {
  const [phase, setPhase] = useState<Phase>({ kind: "checking" });
  const [cfg, setCfg] = useState<AppConfig | null>(null);
  const [busy, setBusy] = useState(false);

  const check = async (c?: AppConfig) => {
    const conf = c ?? cfg;
    setPhase({ kind: "checking" });
    const s = await window.lens.ollamaDetect();
    if (!s.running) setPhase({ kind: "not-running" });
    else if (!conf) return; // config not loaded yet; the [cfg] effect re-runs
    else if (Object.values(conf.ollama.models).some((m) => s.models.includes(m.id)))
      setPhase({ kind: "ready", models: s.models });
    else setPhase({ kind: "choose" });
  };

  useEffect(() => {
    window.lens.config().then((c) => {
      setCfg(c);
      void check(c); // evaluate with the fresh config
    });
    const offPull = window.lens.onOllamaProgress((p) =>
      setPhase((prev) =>
        prev.kind === "pulling"
          ? { ...prev, status: p.status, percent: p.percent }
          : prev,
      ),
    );
    const offInstall = window.lens.onOllamaInstallProgress((p) =>
      setPhase((prev) =>
        prev.kind === "installing"
          ? { ...prev, status: p.status, percent: p.percent }
          : prev,
      ),
    );
    return () => {
      offPull();
      offInstall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const install = async () => {
    setBusy(true);
    setPhase({ kind: "installing", status: "starting…", percent: 0 });
    const r = await window.lens.ollamaInstall();
    setBusy(false);
    if (!r.ok) {
      setPhase({ kind: "error", message: r.error ?? "install failed" });
      return;
    }
    await check();
  };

  const pullTier = async (tier: OllamaModelTier) => {
    setBusy(true);
    setPhase({ kind: "pulling", tier: tier.id, status: "starting…", percent: 0 });
    try {
      await window.lens.ollamaPull(tier.id);
      await window.lens.setOllamaModel(tier.id);
      setBusy(false);
      await check();
    } catch (e) {
      setBusy(false);
      setPhase({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  };

  if (!cfg || phase.kind === "checking") {
    return <div className="card pad">Checking for a local AI (Ollama)…</div>;
  }

  const models = cfg.ollama.models;
  const tiers = Object.values(models);
  const recommended = models[cfg.system.recommendedTier] ?? tiers[0];

  if (phase.kind === "ready") {
    const chosen = tierFor(models, cfg.settings.ollamaModel ?? cfg.ollama.defaultModel);
    return (
      <div className="card pad">
        ✅ Local AI ready{chosen ? ` — narrating with ${chosen.label}` : ""} (private, on this
        machine).
      </div>
    );
  }

  if (phase.kind === "installing") {
    return (
      <div className="card pad">
        <strong>Installing Ollama…</strong>
        <div className="hint" style={{ margin: "6px 0" }}>{phase.status}</div>
        <div className="bar"><span style={{ width: `${phase.percent ?? 5}%` }} /></div>
      </div>
    );
  }

  if (phase.kind === "pulling") {
    return (
      <div className="card pad">
        <strong>Downloading {phase.tier}…</strong>
        <div className="hint" style={{ margin: "6px 0" }}>{phase.status}</div>
        <div className="bar"><span style={{ width: `${phase.percent ?? 5}%` }} /></div>
      </div>
    );
  }

  if (phase.kind === "choose") {
    return (
      <div className="card pad">
        <strong>Local AI (private, on this machine)</strong>
        <p className="hint" style={{ margin: "6px 0 12px" }}>
          Optional — adds natural-language narration to the observations. Pick a model sized for
          this machine ({cfg.system.totalMemGB} GB RAM); you can skip entirely.
        </p>
        {tiers.map((t) => (
          <div className="tier" key={t.id}>
            <div>
              <strong>{t.label}</strong>{" "}
              {t.id === recommended.id && <span className="pill high">recommended</span>}
              <div className="hint">{t.note} · ~{t.sizeGB} GB download</div>
            </div>
            <button className="btn accent" disabled={busy} onClick={() => void pullTier(t)}>
              Download
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (phase.kind === "error") {
    return (
      <div className="card pad errorbox">
        {phase.message}{" "}
        <button className="btn small" onClick={() => void check()}>
          Check again
        </button>
      </div>
    );
  }

  // not-running
  return (
    <div className="card pad">
      <strong>Local AI (optional, private, on this machine)</strong>
      <p className="hint" style={{ margin: "6px 0 12px" }}>
        One-off install (~1 GB). Everything — analysis and narration — stays on this computer.
      </p>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button className="btn accent" disabled={busy} onClick={() => void install()}>
          {busy ? "Installing…" : "Install Ollama now"}
        </button>
        <a href="https://ollama.com/download" target="_blank" rel="noreferrer">
          or install manually
        </a>
        <button className="btn small" onClick={() => void check()}>
          I've installed it — check again
        </button>
      </div>
    </div>
  );
}
