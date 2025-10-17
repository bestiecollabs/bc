(function(){
  if (window.__brandsTableLoaded) return; window.__brandsTableLoaded = true;

  const ADMIN = "collabsbestie@gmail.com";
  const API = "https://api.bestiecollabs.com";

  function q(id){ return document.getElementById(id); }

  async function fetchBrands(){
    const url = new URL(API + "/api/admin/brands?scope=all");
    url.searchParams.set("limit","500");
    url.searchParams.set("offset","0");
    const res = await fetch(url.toString(), { headers: { "x-admin-email": ADMIN }, credentials: "include" });
    if (!res.ok) throw new Error("GET /api/admin/brands " + res.status);
    return res.json();
  }
  function rows(payload){
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }
  function cell(s){ return s == null ? "" : String(s); }

  function btnsFor(kind, id){
    const b = [];
    if (kind === "active"){ b.push(btn("Delete","delete",id), btn("Unpublish","unpublish",id)); }
    else if (kind === "draft"){ b.push(btn("Publish","publish",id), btn("Delete","delete",id)); }
    else if (kind === "deleted"){ b.push(btn("Undo","undo",id)); }
    return b.join(" ");
  }
  function btn(label, action, id){
    return `<button type="button" data-action="${action}" data-id="${id}">${label}</button>`;
  }

  function render(tbodyId, list, kind){
    const tb = q(tbodyId);
    if (!tb){ return; }
    if (!list.length){
      tb.innerHTML = `<tr><td colspan="6" class="muted">No rows</td></tr>`;
      return;
    }
    tb.innerHTML = list.map(b => {
      const id = b.id ?? "";
      const name = b.name ?? b.brand_name ?? "";
      const slug = b.slug ?? "";
      const status = b.status ?? "draft";
      const deleted = b.deleted_at ? "yes" : "";
      return `<tr data-id="${id}">
        <td>${cell(id)}</td>
        <td>${cell(name)}</td>
        <td>${cell(slug)}</td>
        <td>${cell(status)}</td>
        <td>${cell(deleted)}</td>
        <td>${btnsFor(kind, id)}</td>
      </tr>`;
    }).join("");
  }

  async function loadAll(){
    // Show loading
    ["brandsActiveBody","brandsDraftBody","brandsDeletedBody"].forEach(id=>{
      const tb = q(id); if (tb) tb.innerHTML = '<tr><td colspan="6" class="muted">Loading…</td></tr>';
    });
    try{
      const json = await fetchBrands();
      const rs = rows(json);
      const active = rs.filter(r => !r.deleted_at && (String(r.status||"").toLowerCase() !== "draft"));
      const drafts = rs.filter(r => !r.deleted_at && (String(r.status||"").toLowerCase() === "draft"));
      const deleted = rs.filter(r => !!r.deleted_at);
      render("brandsActiveBody", active, "active");
      render("brandsDraftBody", drafts, "draft");
      render("brandsDeletedBody", deleted, "deleted");
    }catch(e){
      console.error(e);
      ["brandsActiveBody","brandsDraftBody","brandsDeletedBody"].forEach(id=>{
        const tb = q(id); if (tb) tb.innerHTML = '<tr><td colspan="6" class="muted">Load error</td></tr>';
      });
    }
  }

  async function post(path, body){
    const res = await fetch(path, {
      method:"POST",
      credentials:"include",
      headers:{ "content-type":"application/json", "x-admin-email": ADMIN },
      body: body ? JSON.stringify(body) : "{}"
    });
    const j = await res.json().catch(()=>({}));
    if (!res.ok || j?.ok === false) throw new Error(j?.error||"request_failed");
    return j;
  }
  async function patch(path, body){
    const res = await fetch(path, {
      method:"PATCH",
      credentials:"include",
      headers:{ "content-type":"application/json", "x-admin-email": ADMIN },
      body: JSON.stringify(body||{})
    });
    const j = await res.json().catch(()=>({}));
    if (!res.ok || j?.ok === false) throw new Error(j?.error||"request_failed");
    return j;
  }

  function wire(){
    const refresh = q("refreshBtn")
      || Array.from(document.querySelectorAll("button")).find(b => (b.textContent||"").trim().toLowerCase()==="refresh");
    if (refresh && !refresh.dataset._wired){ refresh.dataset._wired = "1"; refresh.addEventListener("click", loadAll); }

    // Delegate clicks across all three tables
    document.addEventListener("click", async (ev)=>{
      const btn = ev.target && ev.target.closest && ev.target.closest("button[data-action][data-id]");
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      const act = btn.getAttribute("data-action");
      try{
        if (act === "delete")      await post(`${API}/api/admin/brands/${id}/delete`);
        else if (act === "undo")   await post(`${API}/api/admin/brands/${id}/undo`);
        else if (act === "unpublish") await post(`${API}/api/admin/brands/${id}/unpublish`);
        else if (act === "publish")   await patch(`${API}/api/admin/brands/${id}`, { status: "published" }); // uses PATCH endpoint
        else return;
      } catch(e){ console.error("[brands]", act, "failed:", e); }
      await loadAll();
    });
  }

  document.addEventListener("DOMContentLoaded", function(){
    wire();
    loadAll();
  });

  // manual
  window.__loadBrandsDirectory = loadAll;
})();


;(function(){
  if (!window.__brandsToast) {
    window.__brandsToast = function(msg){
      try{
        var t=document.createElement("div");
        t.textContent=String(msg);
        t.style.position="fixed"; t.style.right="12px"; t.style.bottom="12px";
        t.style.padding="8px 10px"; t.style.background="#111"; t.style.color="#fff";
        t.style.borderRadius="10px"; t.style.zIndex="9999";
        document.body.appendChild(t); setTimeout(()=>t.remove(),1800);
      }catch(_){}
    };
  }
  document.addEventListener("click", function(e){
    const b=e.target && e.target.closest("button[data-action][data-id]");
    if(!b) return;
    const act=b.getAttribute("data-action");
    if (act==="publish"||act==="unpublish"||act==="delete"||act==="undo"){
      setTimeout(()=>{ if(window.__brandsToast) __brandsToast(act+" OK"); }, 0);
    }
  });
})();
