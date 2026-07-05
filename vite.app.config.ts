// Phase 1 — plain Vite to run the real app shell in a browser against mock data
// (no Electron/sidecar). Run: npm run app-dev
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  server: { port: 5181, open: "/app-dev.html" },
  plugins: [react()],
});
