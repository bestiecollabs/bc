(function () {
  if (window.__bestieAuth) return; window.__bestieAuth = true;
  async function getMe() {
    try {
      const r = await fetch("/api/users/me", { headers: { "cache-control": "no-store" }, credentials: "include" });
      if (!r.ok) return { ok: false }; return await r.json();
    } catch { return { ok: false }; }
  }
  function bindLogout() {
    const els = document.querySelectorAll('[data-link="logout"], a[href="/logout"], a[href="/api/logout"]');
    els.forEach(el => { if (el.__bcLogoutBound) return; el.__bcLogoutBound = true;
      el.addEventListener("click", async (e) => { e.preventDefault(); try { await fetch("/api/logout", { method: "POST", credentials:"include" }); } catch {} location.replace("/"); });
    });
  }
  async function toggleHeader() {
    const nav = document.querySelector("nav.auth"); if (!nav) return;
    const me = await getMe();
    nav.querySelectorAll('[data-link="dashboard"]').forEach(el => el.hidden = !me.ok);
    nav.querySelectorAll('[data-link="logout"]').forEach(el => el.hidden = !me.ok);
    nav.querySelectorAll('[data-link="login"]').forEach(el => el.hidden = !!me.ok);
    nav.querySelectorAll('[data-link="create"]').forEach(el => el.hidden = !!me.ok);
  }
  document.addEventListener("DOMContentLoaded", () => { bindLogout(); toggleHeader(); });
})();
