const PREVIEW_HEADER_EMAIL = "collabsbestie@gmail.com"; // used only if server permits
const hdrs = () => ({ "x-admin-email": PREVIEW_HEADER_EMAIL, "content-type": "application/json" });

const $ = (q)=>document.querySelector(q);
const brandId = $("#brandId"), brandOut = $("#brandOut");
const openId  = $("#openId"),  creatorOut = $("#creatorOut");

const authBadge = $("#authBadge");
async function whoami() {
  try {
    const r = await fetch("/api/admin/whoami", { headers: hdrs() });
    const j = await r.json();
    authBadge.textContent = j.allowed ? `Allowed: ${j.email||"unknown"}` : "Denied";
    authBadge.className = `badge ${j.allowed?"ok":"no"}`;
    setButtonsEnabled(j.allowed);
  } catch(e) {
    authBadge.textContent = "Error";
    authBadge.className = "badge no";
    setButtonsEnabled(false);
  }
}
function setButtonsEnabled(ok){
  $("#brandDelete").disabled = !ok;
  $("#brandUndo").disabled = !ok;
  $("#creatorDelete").disabled = !ok;
  $("#creatorUndo").disabled = !ok;
}

function renderTable(tbody, rows, cols, mkActions){
  tbody.innerHTML = "";
  for(const row of rows){
    const tr = document.createElement("tr");
    for(const c of cols){
      const td = document.createElement("td");
      const v = row[c] ?? "";
      td.textContent = v===null?"":String(v);
      tr.appendChild(td);
    }
    const tdA = document.createElement("td");
    if(mkActions) tdA.append(...mkActions(row));
    tr.appendChild(tdA);
    tbody.appendChild(tr);
  }
}

async function api(path, body){
  const opt = body ? { method:"POST", headers: hdrs(), body: JSON.stringify(body) } : { headers: hdrs() };
  const r = await fetch(path, opt);
  const text = await r.text();
  let json; try{ json = JSON.parse(text); } catch{ json = { raw:text }; }
  return { status:r.status, json };
}

/* Brands */
async function loadBrands(){
  const {status,json} = await api("/api/admin/chipchip/brands/list");
  const items = json.items||[];
  renderTable($("#brandTable tbody"), items,
    ["id","name","slug","status","deleted_at"],
    (row)=>[
      button("Del", ()=>confirmAct(()=>brandDelete(row.id))),
      button("Undo", ()=>brandUndo(row.id)),
    ]);
}
async function brandDelete(id){
  const res = await api("/api/admin/chipchip/brands/delete",{ id:Number(id) });
  brandOut.textContent = JSON.stringify(res, null, 2);
  await loadBrands();
}
async function brandUndo(id){
  const res = await api("/api/admin/chipchip/brands/undo",{ id:Number(id) });
  brandOut.textContent = JSON.stringify(res, null, 2);
  await loadBrands();
}

/* Creators */
async function loadCreators(){
  const {status,json} = await api("/api/admin/chipchip/creators/list");
  const items = json.items||[];
  renderTable($("#creatorTable tbody"), items,
    ["open_id","display_name","role","deleted_at"],
    (row)=>[
      button("Del", ()=>confirmAct(()=>creatorDelete(row.open_id))),
      button("Undo", ()=>creatorUndo(row.open_id)),
    ]);
}
async function creatorDelete(open_id){
  const res = await api("/api/admin/chipchip/creators/delete",{ open_id });
  creatorOut.textContent = JSON.stringify(res, null, 2);
  await loadCreators();
}
async function creatorUndo(open_id){
  const res = await api("/api/admin/chipchip/creators/undo",{ open_id });
  creatorOut.textContent = JSON.stringify(res, null, 2);
  await loadCreators();
}

/* Recycle Bin */
async function loadBin(){
  const {status,json} = await api("/api/admin/chipchip/recycle-bin/list");
  const items = json.items||[];
  const tbody = $("#binTable tbody");
  tbody.innerHTML = "";
  for(const r of items){
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${new Date(r.created_at).toISOString()}</td>
                    <td>${r.entity_table}</td>
                    <td>${r.entity_id}</td>`;
    const td = document.createElement("td");
    const btn = button("Undo", async ()=>{
      if(r.entity_table==="brands") await brandUndo(Number(r.entity_id));
      else if(r.entity_table==="creators") await creatorUndo(r.entity_id);
      await loadBin();
    });
    td.appendChild(btn); tr.appendChild(td); tbody.appendChild(tr);
  }
}

/* Helpers */
function button(label, fn){
  const b = document.createElement("button"); b.textContent = label; b.onclick = fn; return b;
}
function confirmAct(fn){
  if(confirm("Confirm delete?")) return fn();
}
$("#brandRefresh").onclick = loadBrands;
$("#creatorRefresh").onclick = loadCreators;
$("#binRefresh").onclick = loadBin;

$("#brandDelete").onclick = ()=>confirmAct(()=>brandDelete(Number(brandId.value)));
$("#brandUndo").onclick   = ()=>brandUndo(Number(brandId.value));
$("#creatorDelete").onclick = ()=>confirmAct(()=>creatorDelete(openId.value.trim()));
$("#creatorUndo").onclick   = ()=>creatorUndo(openId.value.trim());

await whoami();
await Promise.all([loadBrands(), loadCreators(), loadBin()]);
