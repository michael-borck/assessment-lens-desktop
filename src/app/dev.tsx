// Phase 1 — browser dev entry. Renders the real app shell against mock data, no
// Electron/sidecar needed. The Electron renderer will mount <AppShell/> the same way.
import { createRoot } from "react-dom/client";
import { AppShell } from "./AppShell";

createRoot(document.getElementById("root")!).render(<AppShell />);
