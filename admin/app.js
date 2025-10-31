(() => {
  console.log("admin app.js loaded");

  const $ = (s, r=document) => r.querySelector(s);

  const findBody = (label) => {
    const byId = $(`#${label}Rows`);
    if (byId) return byId;
    const hs = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"));
    const h = hs.find(el => el.textContent.trim().toLowerCase().startsWith(label.toLowerCase()));
    if (!h) return null;
    let el = h.nextElementSibling;
    while (el && el.tagName !== "TABLE") el = el.nextElementSibling;
    return el?.tBodies?.[0] || null;
  };

  const bodies = { Active: findBody("Active"), Suspended: findBody("Suspended"), Deleted: findBody("Deleted") };

  const fmt = (v) => {
    if (v == null || v === "") return "";
    const n = Number(v);
    const d = isFinite(n) ? new Date(n < 1e12 ? n * 1000 : n) : new Date(v);
    return isNaN(d) ? String(v) : d.toLocaleString();
  };
  const acct = (u) => u.account_type ?? u.role ?? (u.is_admin ? "admin" : "user");
  const bucket = (u) => {
    const s = String(u.status ?? "").toLowerCase();
    const del = u.deleted === 1 || u.deleted === true || String(u.deleted) === "1" || s.includes("delete");
    const sus = u.suspended === 1 || u.suspended === true || String(u.suspended) === "1" || s.includes("suspend");
    if (del) return "Deleted";
    if (sus) return "Suspended";
    return "Active";
  };

  const actionsHtml = (u) => {
    const isAdmin = u.is_admin === 1 || u.is_admin === true || String(u.is_admin) === "1" || String(u.account_type).toLowerCase() === "admin";
    const isSusp = u.suspended === 1 || u.suspended === true || String(u.suspended) === "1" || String(u.status).toLowerCase().includes("suspend");
    const adminLabel = isAdmin ? "Revoke admin" : "Make admin";
    const suspLabel  = isSusp  ? "Unsuspend"   : "Suspend";
    return [
      `<button class="btn-admin" data-id="${u.id}" data-on="${isAdmin ? 1 : 0}">${adminLabel}</button>`,
      `<button class="btn-suspend" data-id="${u.id}" data-on="${isSusp ? 1 : 0}">${suspLabel}</button>`,
      `<button class="btn-delete" data-id="${u.id}">Delete</button>`
    ].join(" ");
  };

  const row = (u) => {
    const cells = [
      u.id ?? "",
      u.email ?? "",
      u.username ?? "",
      acct(u),
      fmt(u.created_at ?? u.createdAt)
    ].map(v => `<td>${String(v)}</td>`).join("");
    return `<tr data-id="${u.id}">${cells}<td>${actionsHtml(u)}</td></tr>`;
  };

  async function load() {
    console.log("admin fetch /api/admin/users");
    const r = await fetch("/api/admin/users", { credentials: "include", headers: { "Accept": "application/json" } });
    const ct = r.headers.get("content-type") || "";
    console.log("admin api status", r.status, ct);
    const txt = await r.text();
    let data; try { data = JSON.parse(txt); } catch { console.warn("non-JSON:", txt.slice(0,200)); return; }
    const items = Array.isArray(data.items) ? data.items : (Array.isArray(data.users) ? data.users : []);
    for (const k of Object.keys(bodies)) if (bodies[k]) bodies[k].innerHTML = "";
    items.sort((a,b) => String(b.created_at||"").localeCompare(String(a.created_at||"")));
    for (const u of items) {
      const key = bucket(u);
      const tb = bodies[key];
      if (tb) tb.insertAdjacentHTML("beforeend", row(u));
    }
    console.log("admin render complete", { count: items.length });
  }

  document.addEventListener("click", async (e) => {
    const a = e.target.closest("button.btn-admin");
    if (a) {
      const id = a.getAttribute("data-id");
      const cur = a.getAttribute("data-on") === "1";
      a.disabled = true;
      const r = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, is_admin: !cur })
      });
      a.disabled = false;
      if (r.ok) load();
      return;
    }
    const s = e.target.closest("button.btn-suspend");
    if (s) {
      const id = s.getAttribute("data-id");
      const cur = s.getAttribute("data-on") === "1";
      s.disabled = true;
      const r = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, suspend: !cur })
      });
      s.disabled = false;
      if (r.ok) load();
      return;
    }
    const d = e.target.closest("button.btn-delete");
    if (d) {
      const id = d.getAttribute("data-id");
      if (!confirm("Delete this user?")) return;
      d.disabled = true;
      const r = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" });
      d.disabled = false;
      if (r.ok) load();
    }
  });

  window.addEventListener("DOMContentLoaded", load);
})();
