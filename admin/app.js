async function fetchUsers(){
  setStatus("Loading...");
  const r = await fetch("/api/admin/users",{credentials:"include"});
  const j = await r.json(); if(Array.isArray(j?.users)){const __list=j.users;const __norm=s=>(s||"active");j.active=__list.filter(u=>__norm(u.status)==="active");j.suspended=__list.filter(u=>__norm(u.status)==="suspended");j.deleted=__list.filter(u=>__norm(u.status)==="deleted");console.log("[admin] counts",{active:j.active.length,suspended:j.suspended.length,deleted:j.deleted.length});}
  render(j.items||[]);
  clearStatus();
}
function render(items){
  const act = document.getElementById("activeRows");
  const sus = document.getElementById("suspendedRows");
  const del = document.getElementById("deletedRows");
  act.innerHTML = sus.innerHTML = del.innerHTML = "";

  const rowsFor = (where) => where==="active" ? act : where==="suspended" ? sus : del;

  for(const u of items){
    const where = u.deleted ? "deleted" : u.suspended ? "suspended" : "active";
    const tbody = rowsFor(where);
    const tr = document.createElement("tr");
    const dt = u.created_at ? new Date(Number(u.created_at)*1000) : null;
    tr.innerHTML = `
      <td>${u.email}</td>
      <td>${u.username||""}</td>
      <td>${u.account_type||""}</td>
      <td>${dt ? dt.toLocaleString() : ""}</td>
      <td class="actions"></td>`;
    // keep ID as first col if you prefer; adjust header accordingly
    tbody.appendChild(tr);

    const actions = tr.querySelector(".actions");

    const unameBtn = document.createElement("button");
    unameBtn.textContent = "Set username";
    unameBtn.addEventListener("click", async ()=>{
      const v = prompt("Username (3-30, a-z 0-9 . _ -):", u.username||"");
      if (v==null) return;
      setStatus("Saving username...");
      const res = await fetch("/api/admin/users", {
        method:"POST", headers:{"Content-Type":"application/json"}, credentials:"include",
        body: JSON.stringify({ action:"set_username", id:u.id, username:v })
      });
      const j = await res.json();
      setStatus(j.ok ? "Saved" : ("Error: " + (j.error || "unknown")));
      fetchUsers();
    });
    actions.appendChild(unameBtn);

    const sBtn = document.createElement("button");
    sBtn.textContent = u.suspended ? "Unsuspend" : "Suspend";
    sBtn.addEventListener("click", async ()=>{
      setStatus(u.suspended?"Unsuspending...":"Suspending...");
      const res = await fetch("/api/admin/users",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({action:u.suspended?"unsuspend":"suspend", id:u.id})});
      const j = await res.json(); setStatus(j.ok?"Done":"Error: "+(j.error||"unknown")); fetchUsers();
    });
    actions.appendChild(sBtn);

    const dBtn = document.createElement("button");
    dBtn.textContent = u.deleted ? "Undelete" : "Delete";
    dBtn.addEventListener("click", async ()=>{
      if(!u.deleted && !confirm("Soft delete user "+u.id+"?")) return;
      setStatus(u.deleted?"Undeleting...":"Deleting...");
      const res = await fetch("/api/admin/users",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({action:u.deleted?"undelete":"delete", id:u.id})});
      const j = await res.json(); setStatus(j.ok?"Done":"Error: "+(j.error||"unknown")); fetchUsers();
    });
    actions.appendChild(dBtn);
  }
}
document.getElementById("createForm").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  if(!email) return;
  setStatus("Creating...");
  const r = await fetch("/api/admin/users",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({email})});
  const j = await r.json(); if(Array.isArray(j?.users)){const __list=j.users;const __norm=s=>(s||"active");j.active=__list.filter(u=>__norm(u.status)==="active");j.suspended=__list.filter(u=>__norm(u.status)==="suspended");j.deleted=__list.filter(u=>__norm(u.status)==="deleted");console.log("[admin] counts",{active:j.active.length,suspended:j.suspended.length,deleted:j.deleted.length});} setStatus(j.ok?"Created":"Error: "+(j.error||"unknown"));
  e.target.reset(); fetchUsers();
});
function setStatus(t){ document.getElementById("status").textContent=t; }
function clearStatus(){ setStatus(""); }
fetchUsers();

/* FIX: render by named keys to avoid column order bugs */
async function loadUsers() {
  const r = await fetch("/api/admin/users", { headers: window.__cfAccessToken ? { "CF-Access-Jwt-Assertion": window.__cfAccessToken } : {} });
  const data = await r.json(); if(Array.isArray(data?.users)){const __list=data.users;const __norm=s=>(s||"active");data.active=__list.filter(u=>__norm(u.status)==="active");data.suspended=__list.filter(u=>__norm(u.status)==="suspended");data.deleted=__list.filter(u=>__norm(u.status)==="deleted");console.log("[admin] counts",{active:data.active.length,suspended:data.suspended.length,deleted:data.deleted.length});}
  const users = Array.isArray(data) ? data : data.users || [];
  const tbody = document.querySelector("#users-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  for (const u of users) {
    const { id, username, email, role, status, created_at } = u;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${id ?? ""}</td>
      <td>${username ?? ""}</td>
      <td>${email ?? ""}</td>
      <td>${role ?? ""}</td>
      <td>${status ?? ""}</td>
      <td>${created_at ? new Date(created_at).toLocaleString() : ""}</td>
      <td><button class="btn-delete" data-id="${id}">Delete</button></td>
    `;
    tbody.appendChild(tr);
  }
}


