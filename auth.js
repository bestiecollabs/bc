// bc-fetch-include-start
;(() => {
  // default all fetch() calls to send cookies unless explicitly overridden
  const _f = window.fetch;
  window.fetch = function(input, init) {
    init = init || {};
    if (!init.credentials) init.credentials = "include";
    return _f(input, init);
  };
})();
// bc-fetch-include-end
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
// bc-auth-ui-start
;(() => {
  // ensure all fetches send cookies (already patched earlier, keep here idempotently)
  const _f = window.fetch;
  if (_f && !_f.__bcInclude__) {
    window.fetch = function(i, init){ init = init || {}; if (!init.credentials) init.credentials = "include"; return _f(i, init); };
    window.fetch.__bcInclude__ = true;
  }

  async function checkSession() {
    try {
      const r = await fetch("/api/users/me", { credentials: "include" });
      const authed = r.ok;
      document.documentElement.setAttribute("data-auth", authed ? "1" : "0");
      // fire an event so navbars/pages can react
      document.dispatchEvent(new CustomEvent("bc:auth", { detail: { authed } }));
    } catch (_) {
      document.documentElement.setAttribute("data-auth", "0");
    }
  }

  // run at load and after returning from signup/login redirects
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkSession);
  } else {
    checkSession();
  }
})();
// bc-auth-ui-end
// auth-logout-start
(function(){
  function candidates(){
    var list = [];
    list = list.concat(Array.from(document.querySelectorAll('[data-action="logout"]')));
    list = list.concat(Array.from(document.querySelectorAll('#logout, .logout')));
    // Fallback by link text
    list = list.concat(Array.from(document.querySelectorAll('a,button')).filter(function(el){
      return /log\s*out/i.test((el.textContent||'').trim());
    }));
    // Deduplicate
    return Array.from(new Set(list)).filter(Boolean);
  }
  async function doLogout(ev){
    try {
      if (ev && ev.preventDefault) ev.preventDefault();
      await fetch("/api/users/logout", { method:"POST", credentials:"include" });
    } finally {
      // Reload to clear UI and server-side checks
      location.assign("/");
    }
  }
  function bind(){
    candidates().forEach(function(el){
      if (!el.dataset.boundLogout) { el.addEventListener("click", doLogout); el.dataset.boundLogout="1"; }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})();
// auth-logout-end
