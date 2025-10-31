(function () {
  function row(u) {
    var created = u.created_at ? new Date((u.created_at < 1e12 ? u.created_at * 1000 : u.created_at)).toLocaleString() : "";
    var role = u.role || "";
    var id = u.id || "";
    var email = u.email || "";
    var username = u.username || "";
    var tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + id + "</td>" +
      "<td>" + email + "</td>" +
      "<td>" + username + "</td>" +
      "<td>" + role + "</td>" +
      "<td>" + created + "</td>" +
      "<td>" +
        '<button class="btn-set-username" data-id="' + id + '">Set username</button> ' +
        '<button class="btn-suspend" data-id="' + id + '">Suspend</button> ' +
        '<button class="btn-delete" data-id="' + id + '">Delete</button>' +
      "</td>";
    return tr;
  }

  function byId(id) { return document.getElementById(id); }

  async function loadUsers() {
    var statusEl = byId("users-status");
    if (!statusEl) {
      statusEl = document.createElement("p");
      statusEl.id = "users-status";
      statusEl.style.fontSize = "12px";
      document.body.insertBefore(statusEl, document.body.firstChild);
    }
    statusEl.textContent = "Loading users...";
    try {
      var res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) {
        var t = await res.text().catch(function(){ return ""; });
        statusEl.textContent = "Error " + res.status + ": " + t.substring(0,200);
        return;
      }
      var data = await res.json().catch(function(){ return { users: [] }; });
      var users = Array.isArray(data) ? data : (data.users || []);
      statusEl.textContent = "Loaded " + users.length + " users";

      var map = {
        active: byId("users-active"),
        suspended: byId("users-suspended"),
        deleted: byId("users-deleted")
      };
      map.active.innerHTML = "";
      map.suspended.innerHTML = "";
      map.deleted.innerHTML = "";

      users.forEach(function(u){
        var s = (u.status || "active").toLowerCase();
        var target = s === "suspended" ? map.suspended : (s === "deleted" ? map.deleted : map.active);
        target.appendChild(row(u));
      });
    } catch (e) {
      statusEl.textContent = "Runtime error: " + (e && e.message ? e.message : String(e));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadUsers);
  } else {
    loadUsers();
  }
})();
