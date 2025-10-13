(function(){
  const expected = ["name","website_url","category_primary","category_secondary","category_tertiary","instagram_url","tiktok_url","shopify_shop_domain","shopify_shop_id","shopify_public_url","contact_name","contact_title","contact_email","contact_phone","country","state","city","zipcode","address","description","support_email","logo_url","featured","status","has_us_presence","is_dropshipper","notes_admin"];

  const $ = (s)=>document.querySelector(s);
  const file = $("#file");
  const info = { file: $("#file-info"), cols: $("#cols-info"), count: $("#count-info") };
  const btnParse = $("#btn-parse"), btnClear = $("#btn-clear"), btnValidate = $("#btn-validate"), btnImport = $("#btn-import");
  const thead = document.querySelector("#preview thead"), tbody = document.querySelector("#preview tbody");

  let rows = []; let cols = [];
  window.__BRANDS_ROWS = rows; window.__BRANDS_COLS = cols;

  function setPill(el, txt, ok){
    el.textContent = txt;
    el.className = "pill " + (ok==null ? "" : ok ? "ok" : "bad");
  }

  function csvParse(text){
    const out = []; let row = [], col = "", i = 0, q = false;
    while(i < text.length){
      const ch = text[i++];
      if (q){
        if (ch === '"'){ if (text[i] === '"'){ col += '"'; i++; } else { q = false; } }
        else { col += ch; }
      } else {
        if (ch === '"'){ q = true; }
        else if (ch === ","){ row.push(col); col = ""; }
        else if (ch === "\n"){ row.push(col); out.push(row); row = []; col = ""; }
        else if (ch === "\r"){ }
        else { col += ch; }
      }
    }
    if (col.length || row.length) { row.push(col); out.push(row); }
    return out;
  }

  function toObjects(matrix){
    if (!matrix.length) return [];
    const header = matrix[0].map(h => h.trim());
    const body = matrix.slice(1);
    cols = header; window.__BRANDS_COLS = cols;
    return body.filter(r => r.some(c=> String(c||"").trim().length)).map(r=>{
      const obj = {};
      for (let i=0;i<header.length;i++){ obj[header[i]] = r[i] ?? ""; }
      return obj;
    });
  }

  function renderPreview(objs){
    thead.innerHTML = ""; tbody.innerHTML = "";
    const trh = document.createElement("tr");
    cols.forEach(c=>{ const th = document.createElement("th"); th.textContent = c; trh.appendChild(th); });
    thead.appendChild(trh);
    const limit = Math.min(200, objs.length);
    for (let i=0;i<limit;i++){
      const tr = document.createElement("tr");
      cols.forEach(c=>{ const td = document.createElement("td"); td.textContent = objs[i][c] ?? ""; tr.appendChild(td); });
      tbody.appendChild(tr);
    }
    setPill(info.count, `${limit} shown / ${objs.length} total`, true);
    setPill(info.cols, `${cols.length} columns`, null);
  }

  btnParse?.addEventListener("click", async ()=>{
    const f = file.files?.[0]; if (!f){ toast("Select a CSV file"); return; }
    setPill(info.file, `${f.name} (${f.size} bytes)`, null);
    const text = await f.text();
    const matrix = csvParse(text);
    const objs = toObjects(matrix);
    rows = objs; window.__BRANDS_ROWS = rows;
    renderPreview(objs);
    const missing = expected.filter(x => !cols.includes(x));
    setPill(info.cols, `${cols.length} columns` + (missing.length? ` · missing: ${missing.join(", ")}` : ""), missing.length === 0);
    toast("CSV parsed");
  });

  btnClear?.addEventListener("click", ()=>{
    file.value = ""; rows = []; cols = []; window.__BRANDS_ROWS = rows; window.__BRANDS_COLS = cols;
    thead.innerHTML = ""; tbody.innerHTML = "";
    setPill(info.file, "No file", null); setPill(info.cols, "", null); setPill(info.count, "", null);
  });

  btnValidate?.addEventListener("click", ()=>{
    if (!rows.length){ toast("Load a CSV first"); return; }
    const missing = expected.filter(x => !cols.includes(x));
    if (missing.length){ toast("Missing columns: " + missing.join(", ")); return; }
    const bad = []; for (let i=0;i<rows.length;i++){ const r = rows[i]; if (!r.name || !r.website_url) bad.push(i+2); }
    if (bad.length) toast(`Validation found ${bad.length} rows missing name/website_url. Example row ${bad[0]}`); else toast("Validation passed");
  });

  async function postBatch(batch){
    const res = await fetch("/api/admin/chipchip/brands-import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ rows: batch })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json().catch(()=> ({}));
  }

  btnImport?.addEventListener("click", async ()=>{
    if (!rows.length){ toast("Load a CSV first"); return; }
    const missing = expected.filter(x => !cols.includes(x));
    if (missing.length){ toast("Missing columns: " + missing.join(", ")); return; }
    const size = 100; let ok = 0;
    for (let i=0;i<rows.length;i+=size){
      const batch = rows.slice(i, i+size);
      try { await postBatch(batch); ok += batch.length; toast(`Imported ${ok} / ${rows.length}`); }
      catch(e){ console.error(e); toast(`Batch failed at ${i+1} (${e.message})`); break; }
    }
    if (ok === rows.length) toast("Import complete");
  });
})();
