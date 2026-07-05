// The ONE place an app made from this template customises itself.
// Required by both electron-builder.config.js (build) and the main process
// (runtime), so the two never drift.

// One local model, referenced everywhere it matters (Ollama pull + engine env)
// so the model the app pulls is the model the engine narrates with.
const LOCAL_MODEL = "llama3.2:3b";

module.exports = {
  // Identity
  appId: "com.michaelborck.assessmentlens",
  productName: "Assessment Lens",

  // --- Python sidecar (the app's `serve` HTTP API) ---------------------------
  // pip specs installed into the app-local venv on first run. The lens composes
  // the family via CLIs in ONE venv (assessment-lens → bundle-analyser →
  // auto-analyser → specialists), so the router and a curated set of specialist
  // analysers must be installed alongside it or the engine can't analyse
  // anything. [embeddings] extras power text-space distinctiveness (they pull
  // sentence-transformers/torch — the installer forces CPU-only torch).
  // Pin the lens per app release; bump deliberately with the app.
  sidecarPipSpecs: [
    "assessment-lens[serve,analysers,distinctiveness,llm]==0.5.2",
    "auto-analyser", // the router bundle-analyser shells out to
    "document-analyser[embeddings]", // reports, essays (the universal deliverable)
    "code-analyser[embeddings]",
    "conversation-analyser[embeddings]", // AI-chat transcripts
    "reflection-analyser[embeddings]", // reflective journals
  ],
  // Console script the installed package exposes; {PORT}/{HOST} are substituted,
  // resolved against the venv's bin/ dir. (e.g. `assessment-lens serve ...`)
  serveCommand: "assessment-lens serve --port {PORT} --host {HOST}",
  // Health endpoint + default port (the sidecar manager probes this).
  healthPath: "/health",
  defaultPort: 8021,
  // The env var the engine reads its bearer token from — the family standard is
  // {PREFIX}_AUTH_TOKEN (lens-contract add_auth). Main generates the token per
  // session and keeps it out of the renderer.
  authTokenEnv: "ASSESSMENT_LENS_AUTH_TOKEN",
  // Extra env for the spawned engine. Privacy-first: narration runs against the
  // local Ollama, never a cloud provider, and uses the model curated below.
  sidecarEnv: {
    ASSESSMENT_LENS_PROVIDER: "ollama",
    ASSESSMENT_LENS_NARRATE_MODEL: LOCAL_MODEL,
    ASSESSMENT_LENS_DRAFT_MODEL: LOCAL_MODEL,
  },

  // --- Models (fully-offline) ------------------------------------------------
  // Either drop files in resources/models/ (bundled in the installer), or list
  // them here for first-run download with SHA-256 verification. dest is relative
  // to the app-local models dir.
  models: [
    // { url: "https://…/model.bin", sha256: "…", dest: "whisper/ggml-tiny.bin" },
  ],

  // --- Local LLM (Ollama) ----------------------------------------------------
  ollama: {
    recommendedModel: LOCAL_MODEL, // curated default; pulled in-app with progress
    recommendedSizeGB: 2.0,
  },
};
