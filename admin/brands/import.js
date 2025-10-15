/* admin/brands/import.js - ASCII only */
(function(){
  function q(id){ return document.getElementById(id); }
  function log(x){ try{ console.log(x); }catch(e){} }

  async function apiGet(p){
  const r = await fetch(p, { credentials: 'include', headers: { 'x-admin-email': (window.ADMIN_EMAIL||'') } });
  if(!r.ok) throw new Error(p + ' -> ' + r.status);
  return r.json();
}
  async function apiPost(p,b){
  const r = await fetch(p, {
    method:'POST',
    credentials:'include',
    headers:{ 'content-type':'application/json', 'x-admin-email': (window.ADMIN_EMAIL||'') },
    body: JSON.stringify(b||{})
  });
  if(!r.ok) throw new Error(p + ' -> ' + r.status);
  return r.json();
},body:JSON.stringify(b||{})}); if(!r.ok) throw new Error(p+" -> "+r.status); return r.json(); }

  function parseCsv(text){
    const lines = text.replace(/\r\n/g,"\n").replace(/\r/g,"\n").split("\n").filter(Boolean);
    const headers = lines[0].split(",").map(function(s){ return s.trim(); });
    const rows = lines.slice(1).map(function(l){ return l.split(",").map(function(s){ return s.trim(); }); });
    return { headers: headers, rows: rows };
  }

  async function runImport(commit){
    const fileEl = q("csv");
    const statusEl = q("uploadStatus");
    if(!fileEl || !fileEl.files || !fileEl.files[0]){ alert("Select a CSV file"); return; }
    const text = await fileEl.files[0].text();
    const parsed = parseCsv(text);
    var rowsObjs = parsed.rows.map(function(r){
      var o = {}; for(var i=0;i<parsed.headers.length;i++){ o[parsed.headers[i]] = r[i] || ""; } return o;
    });

    statusEl.textContent = commit ? "Committing..." : "Dry run...";

    const batch = await apiPost("/api/admin/import/brands/batches", { mode: commit ? "commit" : "dry-run" });
    if(!batch || !batch.id){ alert("Failed to create batch"); statusEl.textContent=""; return; }

    const sz = 300;
    for(var i=0;i<rowsObjs.length;i+=sz){
      var chunk = rowsObjs.slice(i, i+sz);
      await apiPost("/api/admin/import/brands/batches/"+batch.id+"/rows", { batchId: batch.id, rows: chunk });
      statusEl.textContent = (commit ? "Committing... " : "Dry run... ") + (i+chunk.length) + "/" + rowsObjs.length;
    }

    const final = await apiPost("/api/admin/import/brands/batches/"+batch.id+"/commit", { batchId: batch.id, commit: !!commit });
    statusEl.textContent = (final && final.ok===false) ? "Finalize error." : (commit ? "Commit complete." : "Dry run complete.");
  }

  async function loadBrands(){
    const tbody = q("brandsTbody");
    if(!tbody) return;
    try{
      var data = null;
      var paths = ["/api/admin/brands","/api/admin/brands/list"];
      for(var k=0;k<paths.length;k++){
        try{ data = await apiGet(paths[k]); if(data) break; }catch(e){}
      }
      var rows = (data && (data.rows || data)) || [];
      if(!rows.length){ tbody.innerHTML = '<tr><td colspan="6" class="muted">No brands yet</td></tr>'; return; }
      var html = "";
      for(var j=0;j<rows.length;j++){
        var b = rows[j] || {};
        html += "<tr><td>"+(b.id||"")+"</td><td>"+(b.name||"")+"</td><td>"+(b.slug||"")+"</td><td>"+(b.status||"draft")+"</td><td>"+(b.deleted?"yes":"")+"</td><td></td></tr>";
      }
      tbody.innerHTML = html;
    }catch(e){
      console.error(e); tbody.innerHTML = '<tr><td colspan="6" class="muted">Load error</td></tr>';
    }
  }

  document.addEventListener("DOMContentLoaded", function(){
    var dry = q("dryBtn"), commit = q("commitBtn"), refresh = q("refreshBtn");
    if(dry)    dry.addEventListener("click",  function(){ runImport(false); });
    if(commit) commit.addEventListener("click",function(){ runImport(true);  });
    if(refresh)refresh.addEventListener("click",function(){ loadBrands();     });
    loadBrands();
  });
})();
