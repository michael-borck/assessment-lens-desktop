// PROTOTYPE — plain Vite config to serve the review-screen design prototype in a
// browser (no Electron, no Python sidecar needed). Throwaway; delete with the
// prototype once a direction is chosen. Run: npm run prototype
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  server: { port: 5180, open: "/prototype.html?variant=A" },
  plugins: [react()],
});
