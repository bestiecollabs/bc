(function(){
  function q(id){return document.getElementById(id);}
  async function apiGet(p){
    const r = await fetch(p,{credentials:"include",headers:{"x-admin-email":(window.ADMIN_EMAIL||"")}});
    if(!r.ok) throw new Error(p+" -> "+r.status);
    return r.json();
  }
  async function apiPost(p,b){
    const r = await fetch(p,{
      method:"POST",credentials:"include",
      headers:{"content-type":"application/json","x-admin-email":(window.ADMIN_EMAIL||"")},
      body: JSON.stringify(b||{})
    });
    if(!r.ok) throw new Error(p+" -> "+r.status);
    return r.json();
  }
  function parseCsv(text){
    const lines=text.replace(/\r\n/g,"\n").replace(/\r/g,"\n").split("\n").filter(Boolean);
    const headers=lines[0].split(",").map(s=>s.trim());
    const rows=lines.slice(1).map(l=>l.split(",").map(s=>s.trim()));
    return {headers,rows};
  }
  async function runImport(commit){
    const fileEl=q("csv"), statusEl=q("uploadStatus");
    if(!fileEl||!fileEl.files||!fileEl.files[0]){ alert("Select a CSV file"); return; }
    const text=await fileEl.files[0].text();
    const parsed=parseCsv(text);
    const rowsObjs=parsed.rows.map(r=>{const o={};for(let i=0;i<parsed.headers.length;i++){o[parsed.headers[i]]=r[i]||"";}return o;});
    if(statusEl) statusEl.textContent=commit?"Committing?":"Dry run?";
    let batch;
    try{ batch=await apiPost("/api/admin/import/brands/batches",{mode:commit?"commit":"dry-run"}); }
    catch(e){ console.error(e); if(statusEl) statusEl.textContent="Auth error creating batch"; return; }
    const sz=300;
    for(let i=0;i<rowsObjs.length;i+=sz){
      const chunk=rowsObjs.slice(i,i+sz);
      try{ await apiPost("/api/admin/import/brands/batches/"+batch.id+"/rows",{batchId:batch.id,rows:chunk}); }
      catch(e){ console.error(e); if(statusEl) statusEl.textContent="Rows upload failed"; return; }
      if(statusEl) statusEl.textContent=(commit?"Committing? ":"Dry run? ")+(i+chunk.length)+"/"+rowsObjs.length;
    }
    try{
      const fin=await apiPost("/api/admin/import/brands/batches/"+batch.id+"/commit",{batchId:batch.id,commit:!!commit});
      if(statusEl) statusEl.textContent=(fin&&fin.ok===false)?"Finalize error":(commit?"Commit complete.":"Dry run complete.");
    }catch(e){ console.error(e); if(statusEl) statusEl.textContent="Finalize failed"; }
  }
  async function loadBrands(){
    const tbody=q("brandsTbody"); if(!tbody) return;
    try{
      let data=null; for(const p of ["/api/admin/brands","/api/admin/brands/list"]){ try{ data=await apiGet(p); if(data) break; }catch(e){console.warn(e);} }
      const rows=(data&&(data.rows||data))||[];
      if(!rows.length){ tbody.innerHTML='<tr><td colspan="6" class="muted">No brands yet</td></tr>'; return; }
      tbody.innerHTML=rows.map(b=>`<tr><td>${b.id||""}</td><td>${b.name||""}</td><td>${b.slug||""}</td><td>${b.status||"draft"}</td><td>${b.deleted?"yes":""}</td><td></td></tr>`).join("");
    }catch(e){ console.error(e); tbody.innerHTML='<tr><td colspan="6" class="muted">Load error</td></tr>'; }
  }
  document.addEventListener("DOMContentLoaded",function(){
    const dry=q("dryBtn"), commit=q("commitBtn"), refresh=q("refreshBtn");
    if(dry) dry.addEventListener("click", ()=>runImport(false));
    if(commit) commit.addEventListener("click", ()=>runImport(true));
    if(refresh) refresh.addEventListener("click", loadBrands);
    loadBrands();
  });
})();
