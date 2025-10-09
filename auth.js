// /auth.js â€” header link toggles + simple route guards + footer dot scrub (no theme)
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

  // Footer: remove " Â· " and center typical link rows
  function fixFooter() {
    qa("footer").forEach(f => {
      try { f.innerHTML = f.innerHTML.replace(/\s*Â·\s*/g, " "); } catch {}
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
/* ===== Bestie minimal auth helpers (additive) ===== */
(function () {
  const BASES = ["/", "/index.html", "/login", "/login/"];
  const DASH = "/dashboard/";

  // Utility: JSON GET with no-store to avoid stale auth
  async function getMe() {
    try {
      const r = await fetch("/api/users/me", { headers: { "cache-control": "no-store" } });
      if (!r.ok) return { ok: false };
      const j = await r.json().catch(() => ({ ok: false }));
      return j && j.ok ? j : { ok: false };
    } catch { return { ok: false }; }
  }

  // Redirect if logged in and on home/login
  document.addEventListener("DOMContentLoaded", async () => {
    const me = await getMe();
    const path = location.pathname.replace(/\/+$/, "") || "/";
    if (me.ok && BASES.includes(path)) {
      location.replace(DASH);
      return;
    }

    // Email remember: load into login form if present
    try {
      const emailKey = "bc.remember.email";
      const emailInput = document.querySelector('form[action$="/api/login"] input[type="email"], form#login input[type="email"], input[name="email"]');
      const rememberBox = document.querySelector('#remember, input[name="remember"]');

      // Pre-fill if saved
      const saved = localStorage.getItem(emailKey);
      if (emailInput && saved && !emailInput.value) emailInput.value = saved;

      // Save on submit if checked
      const form = emailInput ? emailInput.closest("form") : null;
      if (form && rememberBox) {
        form.addEventListener("submit", () => {
          const val = emailInput.value || "";
          if (rememberBox.checked && val) localStorage.setItem(emailKey, val);
          else localStorage.removeItem(emailKey);
        }, { once: true });
      }
    } catch {}
  });
})();
/* ===== Bestie logout binder (additive) ===== */
(function () {
  function bindLogout() {
    const els = document.querySelectorAll('[data-link="logout"], a[href="/logout"], a[href="/api/logout"]');
    els.forEach(el => {
      if (el.__bcLogoutBound) return;
      el.__bcLogoutBound = true;
      el.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          // Try API POST first
          const r = await fetch("/api/logout", { method: "POST" });
          if (!r.ok) {
            // Fallback GET route if legacy exists
            await fetch("/logout", { method: "GET", cache: "no-store" }).catch(()=>{});
          }
        } catch {}
        // Always land on home
        try{localStorage.setItem("bc.justLoggedOut","1")}catch(e){};try{localStorage.setItem("bc.justLoggedOut","1")}catch(e){};location.replace("/?loggedout=1&_="+Date.now());
      });
    });
  }
  document.addEventListener("DOMContentLoaded", bindLogout);
})();
/* ===== Bestie protected-route guard (additive) ===== */
(function () {
  if (window.__bcGuardAdded) return; window.__bcGuardAdded = true;

  const PROTECTED_PREFIXES = [
    "/dashboard", "/admin", "/crm", "/settings", "/account",
    "/brands", "/creators", "/score"
  ];

  function isProtected(path) {
    return PROTECTED_PREFIXES.some(p => path === p || path.startsWith(p + "/"));
  }

  async function getMe() {
    try {
      const r = await fetch("/api/users/me", { headers: { "cache-control": "no-store" } });
      if (!r.ok) return { ok: false };
      return await r.json();
    } catch { return { ok: false }; }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    if (!isProtected(path)) return;

    const me = await getMe();
    if (!me || !me.ok) try{localStorage.setItem("bc.justLoggedOut","1")}catch(e){};try{localStorage.setItem("bc.justLoggedOut","1")}catch(e){};location.replace("/?loggedout=1&_="+Date.now());
  });
})();


