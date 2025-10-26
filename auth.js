// /auth.js — header link toggles + simple route guards + footer dot scrub (no theme)
(function () {
  const d = document;
  const qa = (sel, root) => Array.from((root || d).querySelectorAll(sel));
  const setHidden = (nodes, hide) => nodes.forEach(el => { if (el) el.hidden = !!hide; });

  async function me() {
    try {
      const r = await fetch("/api/users/me", { credentials: "include", headers: { "Accept": "application/json" } });
      if (!r.ok) return null;
      const j = await r.json().catch(() => null);
      return j && j.ok ? j.user : null;
    } catch { return null; }
  }

  function toggleHeader(isAuthed) {
    const els = {
      dashboard: qa('[data-link="dashboard"]'),
      login:     qa('[data-link="login"]'),
      create:    qa('[data-link="create"]'),
      logout:    qa('[data-link="logout"]')
    };
    if (isAuthed) {
      setHidden(els.dashboard, false);
      setHidden(els.logout,   false);
      setHidden(els.login,    true);
      setHidden(els.create,   true);
    } else {
      setHidden(els.dashboard, true);
      setHidden(els.logout,    true);
      setHidden(els.login,     false);
      setHidden(els.create,    false);
    }
  }

  function routeGuards(isAuthed) {
    const needAuth  = qa("[data-require-auth]");
    const needGuest = qa("[data-require-guest]");
    const p = location.pathname;
    if (!isAuthed && needAuth.length && p !== "/login/") { location.replace("/login/"); return; }
    if (isAuthed && (needGuest.length || p === "/login/" || p.startsWith("/signup/"))) {
      if (p !== "/account/") location.replace("/account/");
    }
  }

  // Footer: remove " · " and center typical link rows
  function fixFooter() {
    qa("footer").forEach(f => {
      try { f.innerHTML = f.innerHTML.replace(/\s*·\s*/g, " "); } catch {}
      qa("nav, .links, ul", f).forEach(row => {
        row.style.display = "flex";
        row.style.justifyContent = "center";
        row.style.alignItems = "center";
        row.style.flexWrap = "wrap";
        row.style.gap = "16px";
        if (row.tagName === "UL") { row.style.listStyle = "none"; row.style.padding = "0"; row.style.margin = "0"; }
      });
      f.style.textAlign = "center";
    });
  }

  async function init() {
    const user = await me();
    const authed = !!user;
    toggleHeader(authed);
    routeGuards(authed);
    fixFooter();
  }

  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", init);
  else init();

  d.addEventListener("auth:changed", () => init());
})();
