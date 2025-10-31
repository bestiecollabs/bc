(() => {
  const $ = (s, r=document) => r.querySelector(s);

  const byHeading = (label) => {
    const t = String(label).toLowerCase();
    const h = Array.from(document.querySelectorAll("h1,h2,h3")).find(el =>
      el.textContent.trim().toLowerCase().startsWith(t)
    );
    if (!h) return null;
    let el = h.nextElementSibling;
    while (el && el.tagName !== "TABLE") el = el.nextElementSibling;
    return el || null;
  };

  const bodyFor = (section) =>
    $(`#${section}Rows`) ||
    $(`table[data-section="${section}"] tbody`) ||
    (byHeading(section)?.tBodies?.[0] || null);

  const bodies = {
    Active: bodyFor("Active"),
    Suspended: bodyFor("Suspended"),
    Deleted: bodyFor("Deleted"),
  };

  const fmt = (s) => {
    if (!s) return "";
    const d = new Date(s);
    return isNaN(d) ? String(s) : d.toLocaleString();
  };
  const acctType = (u) => u.account_type ?? u.role ?? (u.is_admin ? "admin" : "user");

  const rowHtml = (u) => {
    const cells = [
      u.id ?? "",
      u.email ?? "",
      u.username ?? "",          // Username column
      acctType(u),
      fmt(u.created_at ?? u.createdAt)
    ].map(v => `<td>${String(v)}</td>`).join("");
    return `<tr>${cells}<td></td></tr>`; // actions placeholder
  };

  const bucket = (u) => {
    const s = String(u.status ?? "").toLowerCase();
    const del = u.deleted === 1 || u.deleted === true || String(u.deleted) === "1" || s.includes("delete");
    const sus = u.suspended === 1 || u.suspended === true || String(u.suspended) === "1" || s.includes("suspend");
    if (del) return "Deleted";
    if (sus) return "Suspended";
    return "Active";
  };

  async function load() {
    const r = await fetch("/api/admin/users", { credentials: "include", headers: { "Accept": "application/json" } });
    if (!r.ok || !(r.headers.get("content-type")||"").includes("application/json")) return; // not authorized or wrong response
    const data = await r.json().catch(() => ({}));
    const items = Array.isArray(data.items) ? data.items : (Array.isArray(data.users) ? data.users : []);

    for (const k of Object.keys(bodies)) if (bodies[k]) bodies[k].innerHTML = "";

    items.sort((a,b) => String(b.created_at||"").localeCompare(String(a.created_at||"")));

    for (const u of items) {
      const key = bucket(u);
      const tb = bodies[key];
      if (tb) tb.insertAdjacentHTML("beforeend", rowHtml(u));
    }
  }

  window.addEventListener("DOMContentLoaded", load);
})();
