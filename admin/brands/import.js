(function(){
  // admin email
  function adminEmail(){
    try { return localStorage.getItem("adminEmail") || "collabsbestie@gmail.com"; }
    catch(_) { return "collabsbestie@gmail.com"; }
  }

  // dom helpers
  function q(id){ return document.getElementById(id); }

  // status line helper
  function showStatus(msg){
    var el = document.getElementById("uploadStatus") || document.querySelector(".muted");
    if(el) el.textContent = String(msg);
  }

  // toast
  function toast(msg){
    var t = document.createElement("div");
    t.textContent = String(msg);
    t.style.position = "fixed";
    t.style.right = "16px";
    t.style.bottom = "16px";
    t.style.padding = "10px 12px";
    t.style.background = "#111";
    t.style.color = "#fff";
    t.style.borderRadius = "10px";
    t.style.fontSize = "14px";
    t.style.zIndex = "9999";
    t.style.boxShadow = "0 2px 10px rgba(0,0,0,0.25)";
    document.body.appendChild(t);
    setTimeout(function(){ if(t && t.parentNode){ t.parentNode.removeChild(t); } }, 2200);
  }

  // simple fetchers
  async function apiGet(p){
    var r = await fetch(p, { credentials:"include", headers:{ "x-admin-email": adminEmail() }});
    if(!r.ok) throw new Error(p + " -> " + r.status + " " + (await r.text()));
    return r.json();
  }
  async function apiPostJson(p, body){
    var r = await fetch(p, {
      method:"POST",
      credentials:"include",
      headers:{ "content-type":"application/json", "x-admin-email": adminEmail() },
      body: JSON.stringify(body || {})
    });
    if(!r.ok) throw new Error(p + " -> " + r.status + " " + (await r.text()));
    return r.json();
  }

  // server error-aware uploader wrapper
  async function postBatches(url, init){
    var up = await fetch(url, init);
    if(!up.ok){
      try{
        var err = await up.json();
        if(err && err.error === "invalid_csv_headers"){
          alert(
            "CSV headers invalid.\n" +
            (err.missing && err.missing.length ? ("Missing: " + err.missing.join(", ") + "\n") : "") +
            (err.unexpected && err.unexpected.length ? ("Unexpected: " + err.unexpected.join(", ") + "\n") : "") +
            ("Expected exactly: " + (err.expected || []).join(", "))
          );
        }else{
          alert("Upload failed: " + up.status + " " + (err && (err.error || JSON.stringify(err)) || ""));
        }
      }catch(_){
        alert("Upload failed: " + up.status);
      }
      showStatus("Upload error");
      throw new Error("upload_failed");
    }
    return up;
  }

  // client-side CSV header check to fail fast
  var ACCEPTED_HEADERS_11 = [
    "brand_name","website_url",
    "category_primary","category_secondary","category_tertiary",
    "instagram_url","tiktok_url",
    "description","customer_age_min","customer_age_max","us_based"
  ];
  function validateCsvHeaderLine(line){
    var got = String(line || "").replace(/\r/g,"").trim().split(",").map(function(s){ return s.trim(); });
    var need = ACCEPTED_HEADERS_11.slice();
    var missing = need.filter(function(h){ return got.indexOf(h) === -1; });
    var extras = got.filter(function(h){ return need.indexOf(h) === -1; });
    var ok = missing.length === 0 && extras.length === 0 && got.length === need.length;
    return { ok: ok, missing: missing, extras: extras, got: got };
  }
  async function ensureCsvHeaders(file){
    var text = await file.text();
    var first = (text.split(/\n/)[0] || "").trim();
    var chk = validateCsvHeaderLine(first);
    if(!chk.ok){
      var msg = [
        "CSV headers invalid.",
        chk.missing.length ? ("Missing: " + chk.missing.join(", ")) : "",
        chk.extras.length ? ("Unexpected: " + chk.extras.join(", ")) : "",
        "Expected exactly: " + ACCEPTED_HEADERS_11.join(", ")
      ].filter(Boolean).join("\n");
      alert(msg);
      throw new Error("invalid_csv_headers");
    }
  }

  // brands table loader
  async function loadBrands(){
    var tbody = q("brandsTbody");
    var help = q("brandsHelp");
    if(!tbody) return;
    try{
      // Try canonical list first, then fallbacks if present
      var data = null;
      var paths = ["/api/admin/brands","/api/admin/chipchip/brands","/api/admin/brands/list"];
      for(var i=0;i<paths.length;i++){
        try{ data = await apiGet(paths[i]); if(data) break; }catch(_){}
      }
      var rows = Array.isArray(data) ? data : (data && (data.items || data.rows)) || [];
      if(!rows.length){
        tbody.innerHTML = '<tr><td colspan="6" class="muted">No brands yet</td></tr>';
        if(help) help.style.display = "block";
        return;
      }
      if(help) help.style.display = "none";
      var html = "";
      for(var j=0;j<rows.length;j++){
        var b = rows[j] || {};
        html += '<tr><td>'+(b.id||"")+'</td><td>'+(b.name||"")+'</td><td>'+(b.slug||"")+
                '</td><td>'+((b.status||"published"))+'</td><td>'+(b.deleted?"yes":"")+'</td><td></td></tr>';
      }
      tbody.innerHTML = html;
    }catch(e){
      console.error(e);
      tbody.innerHTML = '<tr><td colspan="6" class="muted">Load error</td></tr>';
      if(help) help.style.display = "block";
    }
  }

  // upload + optional commit
  async function uploadCsvAndMaybeCommit(doCommit){
    var fileEl = q("file") || q("csv");
    if(!fileEl || !fileEl.files || !fileEl.files[0]){ alert("Select a CSV file"); return; }
    var f = fileEl.files[0];

    showStatus(doCommit ? "Uploading for commit..." : "Uploading for dry run...");
    await ensureCsvHeaders(f);

    // create batch via text/plain to Pages Functions
    var up = await postBatches("/api/admin/import/brands/batches", {
      method:"POST",
      credentials:"include",
      headers:{ "content-type":"text/plain", "x-admin-email": adminEmail() },
      body: await f.text()
    });
    var batch = await up.json();
    if(!batch || !batch.ok || !batch.counts){
      showStatus("Batch create error");
      return;
    }
    showStatus("Batch " + batch.counts.total + " rows (" + batch.counts.valid + " valid, " + batch.counts.invalid + " invalid)");

    if(doCommit){
      var id = batch.batch_id || batch.id;
      var fin = await apiPostJson("/api/admin/import/brands/batches/" + id + "/commit", { batchId: id, commit: true });
      if(fin && fin.ok){
  showStatus("Commit complete.");
  await loadBrands();
  // Fallback to batch rows if list is empty
  try{
    var hasTbody = document.getElementById("brandsTbody");
    var isEmpty = hasTbody && /No brands yet|Loading?|Load error/.test(hasTbody.innerHTML);
    if(isEmpty){ await loadBatchRows(id); }
  }catch(_){}
  toast("Publish OK (batch " + id + ")");
}else{
        showStatus("Finalize error");
      }
    }else{
      showStatus("Dry run complete.");
    }
  }

  // wire up
  document.addEventListener("DOMContentLoaded", function(){
    var dry = q("dryBtn") || q("dryrun");
    var commit = q("commitBtn") || q("commit");
    var refresh = q("refreshBrandsBtn");
    if(dry) dry.addEventListener("click", function(){ uploadCsvAndMaybeCommit(false); });
    if(commit) commit.addEventListener("click", function(){ uploadCsvAndMaybeCommit(true); });
    if(refresh) refresh.addEventListener("click", function(){ loadBrands(); });
    loadBrands();
  });
})(
  async function loadBatchRows(id){
    var tbody = document.getElementById("brandsTbody");
    if(!tbody || !id) return false;
    try{
      var r = await fetch("/api/admin/import/brands/batches/"+id+"/rows", {
        credentials:"include",
        headers:{ "x-admin-email": adminEmail() }
      });
      if(!r.ok) return false;
      var j = await r.json().catch(()=>({}));
      var arr = Array.isArray(j) ? j : (j.items || j.rows || []);
      if(!arr || !arr.length) return false;
      var html = arr.map(function(b){
        return '<tr><td>'+(b.id||"")+'</td><td>'+(b.brand_name||b.name||"")+
               '</td><td>'+(b.slug||"")+'</td><td>'+(b.status||"committed")+
               '</td><td>'+(b.deleted?"yes":"")+'</td><td></td></tr>';
      }).join('');
      tbody.innerHTML = html;
      return true;
    }catch(e){ return false; }
  }})();/* PATCH: restore brands table refresh + initial load */
(function(){
  if(window.__brandsRefreshPatched) return; window.__brandsRefreshPatched = true;
  const ADMIN = (window.ADMIN_EMAIL||"collabsbestie@gmail.com");
  function q(id){ return document.getElementById(id); }
  async function apiGet(p){
    const r = await fetch(p,{ credentials:"include", headers:{ "x-admin-email": ADMIN }});
    if(!r.ok) throw new Error("GET "+p+" "+r.status);
    return r.json();
  }
  async function loadBrands(){
    const tbody = q("brandsTbody");
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="muted">Loading…</td></tr>';
    try{
      let data=null, paths=["/api/admin/chipchip/brands","/api/admin/brands","/api/admin/brands/list"];
      for(let i=0;i<paths.length;i++){ try{ data = await apiGet(paths[i]); if(data) break; }catch(_){ } }
      const arr = Array.isArray(data) ? data : (data?.rows || data?.items || data?.data || []);
      if(!arr.length){ tbody.innerHTML = '<tr><td colspan="6" class="muted">No brands yet</td></tr>'; return; }
      tbody.innerHTML = arr.map(b =>
        `<tr><td>${b.id??""}</td><td>${b.name??""}</td><td>${b.slug??""}</td><td>${b.status??"draft"}</td><td>${b.deleted?"yes":""}</td><td></td></tr>`
      ).join("");
    }catch(e){
      tbody.innerHTML = '<tr><td colspan="6" class="muted">Load error</td></tr>';
      console.error("[brands] load error", e);
    }
  }
  document.addEventListener("DOMContentLoaded", function(){
    const refresh = q("refreshBtn") || Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim().toLowerCase()==="refresh");
    if(refresh){ refresh.addEventListener("click", loadBrands); }
    const commitBtn = q("commit") || Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim().toLowerCase()==="commit");
    if(commitBtn){ commitBtn.addEventListener("click", ()=> setTimeout(loadBrands,1500)); }
    loadBrands();
  });
})();
/* PATCH: wire Delete/Undo actions with admin header and refresh */
;(function(){
  if (window.__brandsDeleteUndoPatched) return; window.__brandsDeleteUndoPatched = true;

  const ADMIN = "collabsbestie@gmail.com";
  const API   = "https://api.bestiecollabs.com";

  function qs(sel){ return document.querySelector(sel); }
  function findBtn(textOrId){
    return qs("#"+textOrId) ||
      Array.from(document.querySelectorAll("button")).find(b => (b.textContent||"").trim().toLowerCase()===textOrId.toLowerCase());
  }
  function brandId(){
    const byId = qs("#brandId");
    if (byId && byId.value) return Number(byId.value);
    const any = Array.from(document.querySelectorAll("input")).find(i => (i.placeholder||"").toLowerCase().includes("brand id"));
    return any && any.value ? Number(any.value) : NaN;
  }
  async function post(path){
    const res = await fetch(API+path, { method:"POST", headers:{ "x-admin-email": ADMIN }, credentials:"include" });
    if (!res.ok) throw new Error(path+" "+res.status);
    return res.json();
  }
  async function doDelete(){
    const id = brandId();
    if (!Number.isFinite(id)) { alert("Enter a valid Brand ID"); return; }
    await post(`/api/admin/brands/${id}/delete`);
    if (window.__loadBrandsDirectory) window.__loadBrandsDirectory();
  }
  async function doUndo(){
    const id = brandId();
    if (!Number.isFinite(id)) { alert("Enter a valid Brand ID"); return; }
    await post(`/api/admin/brands/${id}/undo`);
    if (window.__loadBrandsDirectory) window.__loadBrandsDirectory();
  }
  function wire(){
    const del  = findBtn("deleteBtn") || findBtn("delete");
    const undo = findBtn("undoBtn")   || findBtn("undo");
    if (del  && !del.dataset._wired){  del.dataset._wired="1";  del.addEventListener("click", e=>{ e.preventDefault(); doDelete().catch(err=>{ console.error(err); alert("Delete failed"); }); }); }
    if (undo && !undo.dataset._wired){ undo.dataset._wired="1"; undo.addEventListener("click", e=>{ e.preventDefault(); doUndo().catch(err=>{ console.error(err); alert("Undo failed"); }); }); }
  }
  document.addEventListener("DOMContentLoaded", wire);
})();
