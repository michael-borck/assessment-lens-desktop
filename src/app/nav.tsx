// Phase 1 — minimal zero-dep navigation (a screen + a back-stack). Single-window
// Electron app, so no router/URL needed; this gives breadcrumb + back cheaply.
import { createContext, useContext, useState, type ReactNode } from "react";

export type Screen = "dashboard" | "cohort" | "student";
export interface Route {
  screen: Screen;
  params?: Record<string, string>;
  crumb?: string; // label for the breadcrumb back-target
}

interface Nav {
  route: Route;
  stack: Route[];
  go: (r: Route) => void;
  back: () => void;
  reset: (r: Route) => void;
}

const NavCtx = createContext<Nav | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ screen: "dashboard", crumb: "Units" }]);
  const route = stack[stack.length - 1];
  const go = (r: Route) => setStack((s) => [...s, r]);
  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  const reset = (r: Route) => setStack([r]);
  return <NavCtx.Provider value={{ route, stack, go, back, reset }}>{children}</NavCtx.Provider>;
}

export function useNav(): Nav {
  const n = useContext(NavCtx);
  if (!n) throw new Error("useNav outside NavProvider");
  return n;
}
