(function(){
  if (window.__brandsTableLoaded) return; window.__brandsTableLoaded = true;

  const ADMIN = "collabsbestie@gmail.com";
  const API = "https://api.bestiecollabs.com";

  function findDirectoryTbody(){
    // Find the first table inside the "Brands" Directory card and ensure a TBODY we can target
    const cards = Array.from(document.querySelectorAll("h2,h3,div")).filter(n => /Brands/i.test(n.textContent||""));
    const table = document.querySelector("table") || document.querySelector("tbody")?.closest("table");
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
    // Accept {rows:[]}, {data:[]}, raw []
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  }

  async function loadDirectory(){
    const tb = findDirectoryTbody(); if (!tb) return;
    tb.innerHTML = `<tr><td colspan="6">Loading...</td></tr>`;
    try{
      const json = await fetchBrands();
      const rows = normalizeRows(json);
      if (!rows.length){
        tb.innerHTML = `<tr><td colspan="6">No brands found</td></tr>`;
        return;
      }
      const html = rows.map(b => {
        const id   = b.id ?? "";
        const name = b.name ?? b.brand_name ?? "";
        const slug = b.slug ?? "";
        const status = b.status ?? "draft";
        const deleted = (b.deleted_at ? "yes" : "");
        return `<tr><td>${id}</td><td>${name}</td><td>${slug}</td><td>${status}</td><td>${deleted}</td><td></td></tr>`;
      }).join("");
      tb.innerHTML = html;
    } catch (e){
      console.error("[brands] directory load failed:", e);
      tb.innerHTML = `<tr><td colspan="6">Load error</td></tr>`;
    }
  }

  function wireButtons(){
    const refresh = document.getElementById("refreshBtn")
      || Array.from(document.querySelectorAll("button")).find(b => (b.textContent||"").trim().toLowerCase()==="refresh");
    if (refresh && !refresh.dataset._wired){
      refresh.dataset._wired = "1";
      refresh.addEventListener("click", ev => { ev.preventDefault(); loadDirectory(); });
    }
  }

  document.addEventListener("DOMContentLoaded", function(){
    wireButtons();
    loadDirectory();
  });

  // Expose for manual retries if needed
  window.__loadBrandsDirectory = loadDirectory;
})();
