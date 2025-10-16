(function(){
  // config
  function adminEmail(){
    try{ return localStorage.getItem("adminEmail") || "collabsbestie@gmail.com"; }
    catch(_){ return "collabsbestie@gmail.com"; }
  }

  // tiny helpers
  function q(id){ return document.getElementById(id); } function qs(s){ return document.querySelector(s); }
  function showStatus(msg){
    var el = document.getElementById("uploadStatus") || document.querySelector(".muted");
    if(el) el.textContent = String(msg);
  }
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
    setTimeout(function(){ if(t && t.parentNode) t.parentNode.removeChild(t); }, 2200);
  }
  async function apiGet(p){
    var r = await fetch(p, { credentials:"include", headers:{ "x-admin-email": adminEmail() }});
    if(!r.ok) throw new Error(p+" -> "+r.status+" "+(await r.text()));
    return r.json();
  }
  async function apiPostJson(p, body){
    var r = await fetch(p, {
      method:"POST",
      credentials:"include",
      headers:{ "content-type":"application/json", "x-admin-email": adminEmail() },
      body: JSON.stringify(body||{})
    });
    if(!r.ok) throw new Error(p+" -> "+r.status+" "+(await r.text()));
    return r.json();
  }

  // table loader
  async function loadBrands(){
  var tbody = q("brandsTbody");
  var help = q("brandsHelp");
  if(!tbody){ return; }
  try{
    var data = null, paths = ["/api/admin/brands","/api/admin/brands/list"];
    for(var i=0;i<paths.length;i++){
      try{ data = await apiGet(paths[i]); if(data) break; }catch(_){}
    }
    var rows = (data && (data.rows||data.items||data)) || [];
    if(!rows.length){
      tbody.innerHTML = '<tr><td colspan="6" class="muted">No brands yet</td></tr>';
      if(help){ help.style.display = "block"; }
      return;
    }
    if(help){ help.style.display = "none"; }
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
    if(help){ help.style.display = "block"; }
  }
}catch(_){}
      }
      var rows = (data && (data.rows||data.items||data)) || [];
      if(!rows.length){ tbody.innerHTML = '<tr><td colspan="6" class="muted">No brands yet</td></tr>'; return; }
      var html = "";
      for(var j=0;j<rows.length;j++){
        var b = rows[j] || {};
        html += '<tr><td>'+(b.id||"")+'</td><td>'+(b.name||"")+'</td><td>'+(b.slug||"")+
                '</td><td>'+((b.status||"draft"))+'</td><td>'+(b.deleted?"yes":"")+'</td><td></td></tr>';
      }
      tbody.innerHTML = html;
    }catch(e){
      console.error(e);
      if(tbody) tbody.innerHTML = '<tr><td colspan="6" class="muted">Load error</td></tr>';
    }
  }

  // CSV header validation against 11-column spec; clear errors only (no placeholders)
  var ACCEPTED_HEADERS_11 = [
    "brand_name","website_url",
    "category_primary","category_secondary","category_tertiary",
    "instagram_url","tiktok_url",
    "description","customer_age_min","customer_age_max","us_based"
  ];
  function validateCsvHeaderLine(line){
    var got = String(line||"").replace(/\r/g,"").trim().split(",").map(function(s){return s.trim();});
    var need = ACCEPTED_HEADERS_11;
    var missing = need.filter(function(h){ return got.indexOf(h)===-1; });
    var extras  = got.filter(function(h){ return need.indexOf(h)===-1; });
    return { ok: missing.length===0 && extras.length===0 && got.length===need.length, missing:missing, extras:extras, got:got };
  }
  async function ensureCsvHeaders(file){
    var text = await file.text();
    var first = (text.split(/\n/)[0]||"").trim();
    var chk = validateCsvHeaderLine(first);
    if(!chk.ok){
      var msg = [
        "CSV headers invalid.",
        chk.missing.length ? ("Missing: " + chk.missing.join(", ")) : "",
        chk.extras.length  ? ("Unexpected: " + chk.extras.join(", ")) : "",
        "Expected exactly: " + ACCEPTED_HEADERS_11.join(", ")
      ].filter(Boolean).join("\n");
      alert(msg);
      throw new Error("invalid_csv_headers");
    }
  }

  // upload + commit pipeline
  async function uploadCsvAndMaybeCommit(doCommit){
    var fileEl = q("file") || q("csv");
    if(!fileEl || !fileEl.files || !fileEl.files[0]){ alert("Select a CSV file"); return; }
    var f = fileEl.files[0];

    showStatus(doCommit ? "Uploading for commit..." : "Uploading for dry run...");
    await ensureCsvHeaders(f);

    // Create batch by sending raw CSV as text/plain
    var up = await fetch("/api/admin/import/brands/batches", {
      method:"POST",
      credentials:"include",
      headers:{ "content-type":"text/plain", "x-admin-email": adminEmail() },
      body: await f.text()
    });
    if(!up.ok) throw new Error("batches POST -> "+up.status+" "+(await up.text()));
    var batch = await up.json();
    if(!batch || !batch.ok || !batch.counts){ showStatus("Batch create error"); return; }

    // Always show analyzer counts
    showStatus("Batch "+batch.counts.total+" rows ("+batch.counts.valid+" valid, "+batch.counts.invalid+" invalid)");

    // Commit when requested
    if(doCommit){
      var fin = await apiPostJson("/api/admin/import/brands/batches/"+(batch.batch_id||batch.id)+"/commit",
        { batchId: (batch.batch_id||batch.id), commit: true });
      if(fin && fin.ok){
        showStatus("Commit complete.");
        await loadBrands();                    // auto-refresh list
        toast("Publish OK (batch "+(batch.batch_id||batch.id)+")");
      }else{
        showStatus("Finalize error");
      }
    }else{
      showStatus("Dry run complete.");
    }
  }

  // wire UI
  document.addEventListener("DOMContentLoaded", function(){
  var r = q("refreshBrandsBtn");
  if(r){ r.addEventListener("click", function(){ loadBrands(); }); }
    var dry = q("dryBtn") || q("dryrun") || Array.from(document.querySelectorAll("button")).find(function(b){return b.textContent.trim().toLowerCase()==="dry run";});
    var commit = q("commitBtn") || q("commit") || Array.from(document.querySelectorAll("button")).find(function(b){return b.textContent.trim().toLowerCase()==="commit";});
    if(dry)    dry.addEventListener("click",  function(){ uploadCsvAndMaybeCommit(false); });
    if(commit) commit.addEventListener("click",function(){ uploadCsvAndMaybeCommit(true);  });
    loadBrands();
  });
})();