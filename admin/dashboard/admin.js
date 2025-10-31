(function () {
  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function row(u) {
    // Table headers are: ID | Email | Username | Account type | Created | Actions
    const created = u.created_at ? new Date(u.created_at).toLocaleString() : "";
    const role = u.role ?? "";
    const id = u.id ?? "";
    const email = u.email ?? "";
    const username = u.username ?? "";
    return el(`
      <tr>
        <td>${id}</td>
        <td>${email}</td>
        <td>${username}</td>
        <td>${role}</td>
        <td>${created}</td>
        <td>
          <button class="btn-set-username" data-id="${id}">Set username</button>
          <button class="btn-suspend" data-id="${id}">Suspend</button>
          <button class="btn-delete" data-id="${id}">Delete</button>
        </td>
      </tr>
    `);
  }

  @"
async function loadUsers() {
  const statusEl = document.querySelector("#users-status") || (function(){
    const p = document.createElement("p"); p.id = "users-status"; p.style.fontSize = "12px";
    document.body.prepend(p); return p;
  })();
  statusEl.textContent = "Loading users...";
  try {
    const headers = window.__cfAccessToken ? { "CF-Access-Jwt-Assertion": window.__cfAccessToken } : {};
    const res = await fetch("/api/admin/users", { credentials: "include", headers });
    if (!res.ok) {
  const txt = await res.text().catch(()=>"");
  statusEl.textContent = `Error ${res.status}: ${txt.slice(0,200)}`;
  return;
}
    const data = await res.json().catch(()=>({ users: [] }));
    const users = Array.isArray(data) ? data : (data.users || []);
    statusEl.textContent = `Loaded ${users.length} users`;
    const map = {
      active: document.querySelector("#users-active"),
      suspended: document.querySelector("#users-suspended"),
      deleted: document.querySelector("#users-deleted"),
      default: document.querySelector("#users-active"),
    };
    Object.values(map).forEach(t => { if (t) t.innerHTML = ""; });
    for (const u of users) {
      const status = (u.status || "active").toLowerCase();
      const target =
        status === "active" ? map.active :
        status === "suspended" ? map.suspended :
        status === "deleted" ? map.deleted :
        map.default;
      if (target) target.appendChild(row(u));
    }
  } catch (e) {
    statusEl.textContent = `Runtime error: ${e?.message || e}`;
  }
}
"@ : {};
    const res = await fetch("/api/admin/users", { credentials: "include", headers });
    const data = await res.json();
    const users = Array.isArray(data) ? data : (data.users || []);

    const map = {
      active: document.querySelector("#users-active"),
      suspended: document.querySelector("#users-suspended"),
      deleted: document.querySelector("#users-deleted"),
      // Fallback old id
      default: document.querySelector("#users-tbody"),
    };

    Object.values(map).forEach(tbody => { if (tbody) tbody.innerHTML = ""; });

    for (const u of users) {
      const status = (u.status || "active").toLowerCase();
      const target =
        (status === "active" && map.active) ? map.active :
        (status === "suspended" && map.suspended) ? map.suspended :
        (status === "deleted" && map.deleted) ? map.deleted :
        map.default;

      if (target) target.appendChild(row(u));
    }

    // Wire actions only if needed later
  }

  document.addEventListener("DOMContentLoaded", loadUsers);
})();



