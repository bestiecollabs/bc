async function fetchUsers() {
  setStatus("Loading...");
  const r = await fetch("/api/admin/users", { credentials: "include" });
  const j = await r.json();
  render(j.items ?? []);
  clearStatus();
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
      <td>${(u.account_type || "").toString()}</td>
      <td>${dt ? dt.toLocaleString() : ""}</td>
      <td class="actions"></td>`;
    tbody.appendChild(tr);

    const actions = tr.querySelector(".actions");

    const suspendBtn = document.createElement("button");
    suspendBtn.textContent = u.suspended ? "Unsuspend" : "Suspend";
    suspendBtn.addEventListener("click", async () => {
      setStatus((u.suspended ? "Unsuspending..." : "Suspending..."));
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: u.suspended ? "unsuspend" : "suspend", id: u.id }),
      });
      const j = await res.json();
      setStatus(j.ok ? "Done" : ("Error: " + (j.error || "unknown")));
      await fetchUsers();
    });
    actions.appendChild(suspendBtn);

    // Optional hard delete button hidden behind confirm (disabled by default)
    // const delBtn = document.createElement("button");
    // delBtn.textContent = "Delete";
    // delBtn.addEventListener("click", async () => {
    //   if (!confirm("Hard delete user " + u.id + "? This cannot be undone.")) return;
    //   setStatus("Deleting...");
    //   const r = await fetch("/api/admin/users?id=" + encodeURIComponent(u.id), { method: "DELETE", credentials: "include" });
    //   const j = await r.json();
    //   setStatus(j.ok ? "Deleted" : ("Error: " + (j.error || "unknown")));
    //   await fetchUsers();
    // });
    // actions.appendChild(delBtn);
  }
}

document.getElementById("createForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  if (!email) return;
  setStatus("Creating...");
  const r = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email }), // server defaults to creator
  });
  const j = await r.json();
  setStatus(j.ok ? "Created" : ("Error: " + (j.error || "unknown")));
  e.target.reset();
  await fetchUsers();
});

function setStatus(t) { document.getElementById("status").textContent = t; }
function clearStatus() { setStatus(""); }

fetchUsers();
