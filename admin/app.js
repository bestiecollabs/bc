async function fetchUsers(){
  setStatus("Loading...");
  const r = await fetch("/api/admin/users",{credentials:"include"});
  const j = await r.json();
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
  const j = await r.json(); setStatus(j.ok?"Created":"Error: "+(j.error||"unknown"));
  e.target.reset(); fetchUsers();
});
function setStatus(t){ document.getElementById("status").textContent=t; }
function clearStatus(){ setStatus(""); }
fetchUsers();
