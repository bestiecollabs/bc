async function fetchUsers() {
  setStatus("Loading...");
  const r = await fetch("/api/admin/users", { credentials: "include" });
  const j = await r.json();
  render(j.items ?? []);
  clearStatus();
}

function roleSelect(id, role) {
  const r = document.createElement("select");
  ["creator","brand"].forEach(v => {
    const o = document.createElement("option");
    o.value = v; o.textContent = v; if (v === role) o.selected = true;
    r.appendChild(o);
  });
  r.addEventListener("change", async () => {
    setStatus("Updating role...");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, role: r.value }),
    });
    const j = await res.json();
    setStatus(j.ok ? "Role updated" : ("Error: " + (j.error || "unknown")));
  });
  return r;
}

function render(items) {
  const tbody = document.getElementById("rows");
  tbody.innerHTML = "";
  for (const u of items) {
    const tr = document.createElement("tr");
    const dt = u.created_at ? new Date(Number(u.created_at) * 1000) : null;
    tr.innerHTML = `
      <td>${u.id}</td>
      <td>${u.email}</td>
      <td class="role-cell"></td>
      <td>${dt ? dt.toLocaleString() : ""}</td>
      <td><button data-id="${u.id}" class="del">Delete</button></td>`;
    tbody.appendChild(tr);
    tr.querySelector(".role-cell").appendChild(roleSelect(u.id, u.role || "creator"));
  }
  tbody.querySelectorAll("button.del").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete user " + btn.dataset.id + "?")) return;
      setStatus("Deleting...");
      const url = "/api/admin/users?id=" + encodeURIComponent(btn.dataset.id);
      const r = await fetch(url, { method: "DELETE", credentials: "include" });
      const j = await r.json();
      setStatus(j.ok ? "Deleted" : "Error");
      await fetchUsers();
    });
  });
}

document.getElementById("createForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const role = document.getElementById("role").value;
  if (!email) return;
  setStatus("Creating...");
  const r = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, role }),
  });
  const j = await r.json();
  setStatus(j.ok ? "Created" : ("Error: " + (j.error || "unknown")));
  e.target.reset();
  await fetchUsers();
});

function setStatus(t) { document.getElementById("status").textContent = t; }
function clearStatus() { setStatus(""); }

fetchUsers();
