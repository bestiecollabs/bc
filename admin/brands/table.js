(function(){
  if (window.__brandsTableLoaded) return; window.__brandsTableLoaded = true;

  const ADMIN = "collabsbestie@gmail.com";
  const API = "https://api.bestiecollabs.com";

  function $(sel){ return document.querySelector(sel); }

  function findDirectoryTbody(){
    const table = document.querySelector("#brandsTable") || document.querySelector("table") || document.querySelector("tbody")?.closest("table");
    if (!table) return null;
    let tb = table.tBodies && table.tBodies[0] ? table.tBodies[0] : table.querySelector("tbody");
    if (!tb) { tb = document.createElement("tbody"); table.appendChild(tb); }
    tb.id = tb.id || "brandsDirectoryBody";
    return tb;
  }

  async function fetchBrands(){
    const url = new URL(API + "/api/admin/brands");
    url.searchParams.set("limit","200"); url.searchParams.set("offset","0");
    const res = await fetch(url.toString(), { headers: { "x-admin-email": ADMIN }, credentials: "include" });
    if (!res.ok) throw new Error("GET /api/admin/brands " + res.status);
    return res.json();
  }

  function normalizeRows(payload){
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  }

  function actionButtons(id){
    const safeId = String(id ?? "");
    return [
      `<button type="button" data-action="delete" data-id="${safeId}">Delete</button>`,
      `<button type="button" data-action="undo" data-id="${safeId}">Undo</button>`,
      `<button type="button" data-action="unpublish" data-id="${safeId}">Unpublish</button>`
    ].join(" ");
  }

  async function loadDirectory(){
    const tb = findDirectoryTbody(); if (!tb) return;
    tb.innerHTML = `<tr><td colspan="6" class="muted">Loading...</td></tr>`;
    try{
      const json = await fetchBrands();
      const rows = normalizeRows(json);
      if (!rows.length){
        tb.innerHTML = `<tr><td colspan="6" class="muted">No brands found</td></tr>`;
        return;
      }
      const html = rows.map(b => {
        const id     = b.id ?? "";
        const name   = b.name ?? b.brand_name ?? "";
        const slug   = b.slug ?? "";
        const status = b.status ?? "draft";
        const deleted= b.deleted_at ? "yes" : "";
        return `<tr data-id="${id}">
                  <td>${id}</td>
                  <td>${name}</td>
                  <td>${slug}</td>
                  <td>${status}</td>
                  <td>${deleted}</td>
                  <td>${actionButtons(id)}</td>
                </tr>`;
      }).join("");
      tb.innerHTML = html;
    } catch (e){
      console.error("[brands] directory load failed:", e);
      tb.innerHTML = `<tr><td colspan="6" class="muted">Load error</td></tr>`;
    }
  }

  async function postJSON(path, body){
    const res = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "x-admin-email": ADMIN
      },
      body: body ? JSON.stringify(body) : null
    });
    const j = await res.json().catch(()=>({}));
    if (!res.ok || j?.ok === false) throw new Error((j && j.error) || "request_failed");
    return j;
  }

  function wireButtons(){
    // Manual Refresh button
    const refresh = document.getElementById("refreshBtn")
      || Array.from(document.querySelectorAll("button")).find(b => (b.textContent||"").trim().toLowerCase()==="refresh");
    if (refresh && !refresh.dataset._wired){
      refresh.dataset._wired = "1";
      refresh.addEventListener("click", ev => { ev.preventDefault(); loadDirectory(); });
    }

    // Delegated row actions on tbody for first-click reliability
    const tb = findDirectoryTbody();
    if (tb && !tb.dataset._wired){
      tb.dataset._wired = "1";
      tb.addEventListener("click", async function(ev){
        const btn = ev.target && ev.target.closest && ev.target.closest("button[data-action][data-id]");
        if (!btn) return;
        const action = btn.getAttribute("data-action");
        const id = btn.getAttribute("data-id");
        if (!id) return;
        try{
          if (action === "delete"){
            await postJSON(`${API}/api/admin/brands/${id}/delete`);
          } else if (action === "undo"){
            await postJSON(`${API}/api/admin/brands/${id}/undo`);
          } else if (action === "unpublish"){
            await postJSON(`${API}/api/admin/brands/${id}/unpublish`);
          } else {
            return;
          }
        } catch(e){
          console.error("[brands] action error:", e);
        } finally {
          // Always refresh the table after any action
          loadDirectory();
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function(){
    wireButtons();
    loadDirectory();
  });

  // Expose for manual retries
  window.__loadBrandsDirectory = loadDirectory;
})();