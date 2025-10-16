/**
 * Admin global script
 * - Loads on all admin pages
 * - Keeps existing admin tables and actions
 * - Wires Brands CSV Dry run and Commit on /admin/brands/
 */
(async function(){
  /* ensure BrandTemplate is loaded for CSV template download */
  (function ensureBrandTemplate(){
    if (window.BrandTemplate) return;
    const s = document.createElement("script");
    s.src = "/admin/lib/brandTemplate.js";
    s.async = false;
    document.head.appendChild(s);
  })();

  const devEmail = ""; // optional dev override

  const $  = (q)=>document.querySelector(q);
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
    const email = (window.ADMIN_EMAIL || devEmail || localStorage.getItem("adminEmail") || "");
    if (email) h["x-admin-email"] = email;
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
      if (badge){
        badge.textContent = ok ? `Allowed: ${json.email||"unknown"}` : "Denied";
        badge.style.background = ok ? "#0a3" : "#6b1b1b";
        badge.style.color = "#fff";
      }
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
    if (!tbody) return;
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
  function btn(label, fn){ const b=document.createElement("button"); b.textContent=label; b.onclick=fn; return b; }
  function confirmDel(fn){ if(confirm("Confirm delete?")) return fn(); }

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
    const k = $("#kpiBrands"); if(k) k.textContent = items.length;
  }
  async function brandDelete(id){
    const res = await api("/api/admin/chipchip/brands/delete",{ id:Number(id) });
    const o = $("#brandOut"); if (o) o.textContent = JSON.stringify(res, null, 2);
    await loadBrands();
  }
  async function brandUndo(id){
    const res = await api("/api/admin/chipchip/brands/undo",{ id:Number(id) });
    const o = $("#brandOut"); if (o) o.textContent = JSON.stringify(res, null, 2);
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
    const k = $("#kpiCreators"); if(k) k.textContent = items.length;
  }
  async function creatorDelete(open_id){
    const res = await api("/api/admin/chipchip/creators/delete",{ open_id });
    const o = $("#creatorOut"); if (o) o.textContent = JSON.stringify(res, null, 2);
    await loadCreators();
  }
  async function creatorUndo(open_id){
    const res = await api("/api/admin/chipchip/creators/undo",{ open_id });
    const o = $("#creatorOut"); if (o) o.textContent = JSON.stringify(res, null, 2);
    await loadCreators();
  }

  /* Recycle Bin */
  async function loadBin(){
    const { json } = await api("/api/admin/chipchip/recycle-bin/list");
    const tbody = $("#binTable tbody");
    if (!tbody) return;
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

  /* Wire controls */
  const w = (id, fn)=>{ const el=document.getElementById(id); if(el) el.onclick=fn; };
  w("brandRefresh", loadBrands);
  w("creatorRefresh", loadCreators);
  w("binRefresh", loadBin);
  w("brandDelete", ()=>confirmDel(()=>brandDelete(Number($("#brandId").value))));
  w("brandUndo",   ()=>brandUndo(Number($("#brandId").value)));
  w("creatorDelete",()=>confirmDel(()=>creatorDelete($("#openId").value.trim())));
  w("creatorUndo",  ()=>creatorUndo($("#openId").value.trim()));

  /* Init */
  await whoami();
  await Promise.all([loadBrands(), loadCreators(), loadBin()]);

  /* CSV template download */
  document.addEventListener("DOMContentLoaded", function(){
    const btn = document.getElementById("downloadTpl");
    if (!btn || !window.BrandTemplate) return;
    btn.addEventListener("click", function(e){
      e.preventDefault();
      const header = BrandTemplate.HEADERS.join(",");
      const csv = header + "\r\n";
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = BrandTemplate.FILENAME;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(a.href), 0);
    });
  });

  /* BrandsImportUI: Dry run + Commit */
  (function BrandsImportUI(){
    try{
      const p = (location.pathname||"").toLowerCase();
      if (!p.startsWith("/admin/brands/")) return;

      const file   = document.getElementById("file");
      const dryBtn = document.getElementById("dryBtn") || document.getElementById("dryrun");
      const comBtn = document.getElementById("commitBtn") || document.getElementById("commit");
      const out    = document.getElementById("uploadStatus") || document.getElementById("actout");
      if (!file || !dryBtn || !comBtn) return;

      const ADMIN = (window.ADMIN_EMAIL || localStorage.getItem("adminEmail") || "");
      const API   = "https://api.bestiecollabs.com";
      let currentBatchId = null;

      function show(msg){ if(out) out.textContent = String(msg); }

      async function dryRun(){
        const f = file.files && file.files[0];
        if (!f) { alert("Choose a CSV first"); return; }
        const csv = await f.text();
        const r = await fetch(`${API}/api/admin/import/brands/batches`, {
          method:"POST",
          headers:{ "content-type":"text/plain", "x-admin-email": ADMIN },
          credentials:"include",
          body: csv
        });
        const j = await r.json().catch(()=>null);
        if(!r.ok || !j){ throw new Error("batches "+r.status); }
        currentBatchId = j.batch_id || j.id || null;
        window.BRAND_IMPORT_ID = currentBatchId;
        const c = j.counts || {};
        show(`parsed: total=${c.total??0} valid=${c.valid??0} invalid=${c.invalid??0} (batch ${currentBatchId??"?"})`);
      }

      async function doCommit(){
        const id = currentBatchId || window.BRAND_IMPORT_ID;
        if(!id){ alert("Run Dry run first"); return; }
        const r = await fetch(`${API}/api/admin/import/brands/batches/${id}/commit`, {
          method:"POST",
          headers:{ "x-admin-email": ADMIN },
          credentials:"include"
        });
        const j = await r.json().catch(()=>({}));
        show(j.ok ? `publish ok (batch ${id})` : `commit failed: ${j.error||r.status}`);
      }

      dryBtn.addEventListener("click", ()=>dryRun().catch(e=>{ console.error(e); show("error: "+e.message); }));
      comBtn.addEventListener("click", ()=>doCommit().catch(e=>{ console.error(e); show("error: "+e.message); }));
    }catch(e){ console.error(e); }
  })();
})();
