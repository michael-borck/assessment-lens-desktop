// Phase 1 — app shell: header (breadcrumb + back) + the active screen.
import { NavProvider, useNav } from "./nav";
import { Dashboard } from "./screens/Dashboard";
import { Cohort } from "./screens/Cohort";
import { Student } from "./screens/Student";
import "./app.css";

function Chrome() {
  const { route, stack, back } = useNav();
  const crumbs = stack.map((r) => r.crumb ?? r.screen);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Assessment&nbsp;Lens</div>
        {stack.length > 1 && <button className="btn back" onClick={back}>←</button>}
        <nav className="crumbs">
          {crumbs.map((c, i) => (
            <span key={i}>{i > 0 && <span className="sep">/</span>}<span className={i === crumbs.length - 1 ? "here" : "muted"}>{c}</span></span>
          ))}
        </nav>
      </header>
      <main className="main">
        {route.screen === "dashboard" && <Dashboard />}
        {route.screen === "cohort" && <Cohort params={route.params} />}
        {route.screen === "student" && <Student params={route.params} />}
      </main>
    </div>
  );
}

export function AppShell() {
  return (
    <NavProvider>
      <Chrome />
    </NavProvider>
  );
}
