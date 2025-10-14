/**
 * functions/api/admin/import/brands/batches.js
 * GET  -> list latest batches
 * POST -> upload CSV, create batch + rows, return counts
 */

function parseCSV(text) {
  const rows = [];
  let i = 0, cur = "", inQ = false, row = [];
  while (i < text.length) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i += 2; continue; }
      if (ch === '"') { inQ = false; i++; continue; }
      cur += ch; i++; continue;
    }
    if (ch === '"') { inQ = true; i++; continue; }
    if (ch === ',') { row.push(cur); cur = ""; i++; continue; }
    if (ch === '\r') { i++; continue; }
    if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ""; i++; continue; }
    cur += ch; i++; continue;
  }
  row.push(cur); rows.push(row);
  return rows;
}

function validateBrand(jo) {
  const errs = [];
  if (!jo.name) errs.push("name required");
  if (!jo.slug) errs.push("slug required");
  if (!jo.website_url) errs.push("website_url required");
  return { valid: errs.length === 0 ? 1 : 0, errs };
}

export async function onRequestGet({ env }) {
  const db = env.DB;
  const rs = await db.prepare("SELECT id,created_at,source_uri,status FROM import_batches ORDER BY id DESC LIMIT 50").all();
  return new Response(JSON.stringify({ ok: true, batches: rs.results }), { headers: { "Content-Type": "application/json" } });
}

export async function onRequestPost({ request, env }) {
  const db = env.DB;

  // Basic guards
  const ct = (request.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes("text/csv")) {
    return new Response(JSON.stringify({ ok: false, error: "content-type must be text/csv" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const raw = (await request.text()) || "";
  const body = raw.trim();
  if (!body) {
    return new Response(JSON.stringify({ ok: false, error: "empty body" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Parse CSV
  const rows = parseCSV(body);
  if (rows.length < 2) {
    return new Response(JSON.stringify({ ok: false, error: "no rows" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const headers = rows[0].map(h => String(h || "").trim());
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const fields = ["name","slug","domain","website_url","category_primary","category_secondary","category_tertiary","instagram_url","tiktok_url","logo_url","featured","description"];

  try {
    await db.exec("BEGIN TRANSACTION");
    await db.prepare("INSERT INTO import_batches (source_uri,status,created_at) VALUES (?,'new',datetime('now'))")
      .bind("inline:csv")
      .run();
    const idRow = await db.prepare("SELECT last_insert_rowid() AS id").first();
    const batchId = Number(idRow?.id || 0);

    const insertRow = await db.prepare("INSERT INTO import_rows (batch_id,row_num,parsed_json,errors_json,valid) VALUES (?,?,?,?,?)");

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      // Skip empty trailing lines
      if (row.length === 1 && String(row[0] || "").trim() === "") continue;

      const jo = {};
      for (const f of fields) jo[f] = idx[f] != null ? String(row[idx[f]] || "").trim() : "";
      jo.featured = jo.featured ? Number(jo.featured) : 0;

      const { valid, errs } = validateBrand(jo);
      await insertRow.bind(batchId, r, JSON.stringify(jo), JSON.stringify(errs), valid).run();
    }

    await db.exec("COMMIT");

    const counts = await db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN valid=1 THEN 1 ELSE 0 END),0) AS valid,
        COALESCE(SUM(CASE WHEN valid=0 THEN 1 ELSE 0 END),0) AS invalid,
        COUNT(*) AS total
      FROM import_rows WHERE batch_id=?`).bind(batchId).first();

    return new Response(JSON.stringify({ ok: true, batch_id: batchId, counts }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    try { await db.exec("ROLLBACK"); } catch {}
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
