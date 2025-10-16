(async function(){
/* disabled: legacy guard for /admin/brands/ */// skip legacy UI on brands
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

/* CSV download handler */
document.addEventListener("DOMContentLoaded", function(){
  var btn = document.getElementById("downloadTpl");
  if (!btn || !window.BrandTemplate) return;
  btn.addEventListener("click", function(e){
    e.preventDefault();
    var header = BrandTemplate.HEADERS.join(",");
    var csv = header + "\r\n";
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = BrandTemplate.FILENAME;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 0);
  });
});
})();


function apiPost(p, body){
  const url0 = String(p);
  const url = url0.startsWith("/api/") ? ("https://api.bestiecollabs.com" + url0) : url0;

  const isBatches = url.includes("/api/admin/import/brands/batches") && !/\/commit$/.test(url);
  const isCommit  = /\/commit$/.test(url) && url.includes("/api/admin/import/brands/batches/");

  if (isBatches){
    const getCsv = async () => {
      if (typeof body === "string") return body;
      if (body && body.file instanceof File) return await body.file.text();
      const f = document.getElementById("file")?.files?.[0];
      return f ? await f.text() : "";
    };
    return getCsv().then(csv => fetch(url, {
      method: "POST",
      headers: { "content-type":"text/plain", "x-admin-email": (window.ADMIN_EMAIL||"") },
      credentials: "include",
      body: csv
    }));
  }

  if (isCommit){
    return fetch(url, {
      method: "POST",
      headers: { "x-admin-email": (window.ADMIN_EMAIL||"") },
      credentials: "include"
    });
  }

  const isString = typeof body === "string";
  const headers = isString
    ? { "content-type":"text/plain", "x-admin-email": (window.ADMIN_EMAIL||"") }
    : { "content-type":"application/json", "x-admin-email": (window.ADMIN_EMAIL||"") };
  const payload = isString ? body : JSON.stringify(body||{});
  return fetch(url, { method:"POST", headers, credentials:"include", body: payload });
}

/* csv-uploader: explicit handlers for Brands import */
(function(){
  const API = "https://api.bestiecollabs.com";
  const ADMIN = (window.ADMIN_EMAIL||"");

  function el(id){ return document.getElementById(id); }
  function show(msg){
    const o = document.getElementById("actout") || document.querySelector(".muted");
    if (o) o.textContent = String(msg);
  }

  async function uploadCSV(){
    const f = el("file")?.files?.[0];
    if(!f) throw new Error("select a CSV file");
    const r = await fetch(`${API}/api/admin/import/brands/batches`, {
      method:"POST",
      headers:{ "content-type":"text/plain", "x-admin-email": ADMIN },
      credentials:"include",
      body: await f.text()
    });
    if(!r.ok) throw new Error(`batches -> ${r.status}`);
    return r.json();
  }

  const dry = el("dryrun");
  if (dry && !dry._wired){
    dry._wired = true;
    dry.addEventListener("click", async ()=>{
      try {
        const j = await uploadCSV();
        show(`parsed: total=${j.counts?.total||0} valid=${j.counts?.valid||0} invalid=${j.counts?.invalid||0} (batch ${j.batch_id})`);
      } catch(e){ show("error: "+e.message); }
    });
  }

  const commit = el("commit");
  if (commit && !commit._wired){
    commit._wired = true;
    commit.addEventListener("click", async ()=>{
      try {
        const j = await uploadCSV();
        const r = await fetch(`${API}/api/admin/import/brands/batches/${j.batch_id}/commit`, {
          method:"POST",
          headers:{ "x-admin-email": ADMIN },
          credentials:"include"
        });
        const cj = await r.json().catch(()=>({}));
        show(cj.ok ? "publish ok" : ("commit failed: "+(cj.error||r.status)));
      } catch(e){ show("error: "+e.message); }
    });
  }
})();
/* BrandsImportUI wired */
;(function BrandsImportUI(){
  try {
    var p = location.pathname.toLowerCase();
    if (!p.startsWith('/admin/brands/')) return;

    var \$ = function(s){ return document.querySelector(s); };
    var file   = \#file;
    var dryBtn = \#dryrun;
    var comBtn = \#commit;
    if (!file || !dryBtn || !comBtn) return;

    var adminEmail = (window.ADMIN_EMAIL || 'collabsbestie@gmail.com');
    var headers = { 'x-admin-email': adminEmail };
    var batchId = null;

    dryBtn.addEventListener('click', async function(){
      try {
        var f = file.files && file.files[0];
        if (!f) { alert('Choose a CSV first'); return; }
        var text = await f.text();
        var resp = await fetch('/api/admin/import/brands/batches', {
          method: 'POST',
          headers: Object.assign({ 'content-type': 'text/plain' }, headers),
          body: text
        });
        var j = await resp.json();
        if (!j || !j.ok) { alert('Dry run failed'); return; }
        batchId = j.id;
        window.BRAND_IMPORT_ID = j.id;
        var c = (j.counts || {});
        alert('Dry run OK. ID ' + j.id + '. Total ' + (c.total ?? '?') + ', Valid ' + (c.valid ?? '?') + ', Invalid ' + (c.invalid ?? '?'));
      } catch (e) { console.error(e); alert('Dry run error'); }
    });

    comBtn.addEventListener('click', async function(){
      try {
        if (!batchId) batchId = window.BRAND_IMPORT_ID;
        if (!batchId) { alert('Run Dry run first'); return; }
        var payload = { batchId: batchId, action: 'draft', allow_non_us: 0 };
        var resp = await fetch('/api/admin/import/brands/batches/' + batchId + '/commit', {
          method: 'POST',
          headers: Object.assign({ 'content-type': 'application/json' }, headers),
          body: JSON.stringify(payload)
        });
        var j = await resp.json();
        if (j && j.ok && j.committed) { alert('Commit OK for ' + batchId); }
        else { alert('Commit failed'); }
      } catch (e) { console.error(e); alert('Commit error'); }
    });
  } catch (e) { console.error(e); }
})();
