/* ensure BrandTemplate is loaded for Admin */
(function ensureBrandTemplate(){
  if (window.BrandTemplate) return;
  var s=document.createElement("script");
  s.src="/admin/lib/brandTemplate.js";
  s.async=false;
  document.head.appendChild(s);
})();
const devEmail = ""; // optional. set to "collabsbestie@gmail.com" for preview-only testing

const $ = (q)=>document.querySelector(q);
const $$ = (q)=>document.querySelectorAll(q);

/* Nav handling */
$$(".nav a").forEach(a=>{
  a.onclick = (e)=>{
    e.preventDefault();
    $$(".nav a").forEach(x=>x.classList.remove("active"));
    a.classList.add("active");
    const id = a.getAttribute("data-target");
    if(id) document.querySelector(id).scrollIntoView({behavior:"smooth", block:"start"});
  };
});

/* API helper */
function hdrs(){
  const h = { "content-type":"application/json" };
  if (devEmail) h["x-admin-email"] = devEmail;
  return h;
}
async function api(path, body){
  const opt = body ? { method:"POST", headers:hdrs(), body:JSON.stringify(body) } : { headers:hdrs() };
  const r = await fetch(path, opt);
  const text = await r.text();
  let json; try{ json = JSON.parse(text); } catch { json = { raw:text }; }
  return { status:r.status, json };
}

/* Auth badge */
async function whoami(){
  try{
    const { json } = await api("/api/admin/whoami");
    const badge = $("#authBadge");
    const ok = !!json.allowed;
    badge.textContent = ok ? `Allowed: ${json.email||"unknown"}` : "Denied";
    badge.style.background = ok ? "#0a3" : "#6b1b1b";
    badge.style.color = "#fff";
    setButtons(ok);
    return ok;
  }catch{
    setButtons(false);
    return false;
  }
}
function setButtons(ok){
  ["brandDelete","brandUndo","creatorDelete","creatorUndo"].forEach(id=>{
    const el = document.getElementById(id); if(el) el.disabled = !ok;
  });
}

/* Render helpers */
function renderTable(tbody, rows, cols, mkActions){
  tbody.innerHTML = "";
  for(const row of rows){
    const tr = document.createElement("tr");
    for(const c of cols){
      const td = document.createElement("td");
      td.textContent = row[c] ?? "";
      tr.appendChild(td);
    }
    const tdA = document.createElement("td");
    if(mkActions){
      const div = document.createElement("div"); div.className="btnrow";
      for(const b of mkActions(row)) div.appendChild(b);
      tdA.appendChild(div);
    }
    tr.appendChild(tdA);
    tbody.appendChild(tr);
  }
}

/* Brands */
async function loadBrands(){
  const { json } = await api("/api/admin/chipchip/brands/list");
  const items = json.items || [];
  renderTable($("#brandTable tbody"), items,
    ["id","name","slug","status","deleted_at"],
    (row)=>[
      btn("Del", ()=>confirmDel(()=>brandDelete(row.id))),
      btn("Undo", ()=>brandUndo(row.id)),
    ]
  );
  $("#kpiBrands").textContent = items.length;
}
async function brandDelete(id){
  const res = await api("/api/admin/chipchip/brands/delete",{ id:Number(id) });
  $("#brandOut").textContent = JSON.stringify(res, null, 2);
  await loadBrands();
}
async function brandUndo(id){
  const res = await api("/api/admin/chipchip/brands/undo",{ id:Number(id) });
  $("#brandOut").textContent = JSON.stringify(res, null, 2);
  await loadBrands();
}

/* Creators */
async function loadCreators(){
  const { json } = await api("/api/admin/chipchip/creators/list");
  const items = json.items || [];
  renderTable($("#creatorTable tbody"), items,
    ["open_id","display_name","role","deleted_at"],
    (row)=>[
      btn("Del", ()=>confirmDel(()=>creatorDelete(row.open_id))),
      btn("Undo", ()=>creatorUndo(row.open_id)),
    ]
  );
  $("#kpiCreators").textContent = items.length;
}
async function creatorDelete(open_id){
  const res = await api("/api/admin/chipchip/creators/delete",{ open_id });
  $("#creatorOut").textContent = JSON.stringify(res, null, 2);
  await loadCreators();
}
async function creatorUndo(open_id){
  const res = await api("/api/admin/chipchip/creators/undo",{ open_id });
  $("#creatorOut").textContent = JSON.stringify(res, null, 2);
  await loadCreators();
}

/* Recycle Bin */
async function loadBin(){
  const { json } = await api("/api/admin/chipchip/recycle-bin/list");
  const tbody = $("#binTable tbody");
  tbody.innerHTML = "";
  for(const r of (json.items||[])){
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${new Date(r.created_at).toISOString()}</td>
                    <td>${r.entity_table}</td>
                    <td>${r.entity_id}</td>`;
    const td = document.createElement("td");
    const b = btn("Undo", async ()=>{
      if(r.entity_table==="brands") await brandUndo(Number(r.entity_id));
      else if(r.entity_table==="creators") await creatorUndo(r.entity_id);
      await loadBin();
    });
    td.appendChild(b); tr.appendChild(td); tbody.appendChild(tr);
  }
}

/* UI helpers */
function btn(label, fn){ const b=document.createElement("button"); b.textContent=label; b.onclick=fn; return b; }
function confirmDel(fn){ if(confirm("Confirm delete?")) return fn(); }

/* Wire controls */
$("#brandRefresh").onclick = loadBrands;
$("#creatorRefresh").onclick = loadCreators;
$("#binRefresh").onclick = loadBin;

$("#brandDelete").onclick = ()=>confirmDel(()=>brandDelete(Number($("#brandId").value)));
$("#brandUndo").onclick   = ()=>brandUndo(Number($("#brandId").value));
$("#creatorDelete").onclick = ()=>confirmDel(()=>creatorDelete($("#openId").value.trim()));
$("#creatorUndo").onclick   = ()=>creatorUndo($("#openId").value.trim());

/* Init */
await whoami();
await Promise.all([loadBrands(), loadCreators(), loadBin()]);
