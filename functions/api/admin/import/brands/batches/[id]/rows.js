/**
 * POST /api/admin/import/brands/batches/:id/rows
 * Accepts: text/plain CSV OR application/json array of rows.
 * Returns: { ok, batch_id, total, valid, invalid }
 */
export async function onRequestPost({ request, env, params }) {
  const email = String(request.headers.get("x-admin-email") || "").toLowerCase().trim();
  const allowed = (env?.ADMIN_ADMINS || "collabsbestie@gmail.com")
    .split(",").map(s=>s.trim().toLowerCase());
  if (!email) return j({ ok:false, error:"missing_admin_email" }, 401);
  if (!allowed.includes(email)) return j({ ok:false, error:"not_allowed", email }, 401);

  const batch_id = params?.id || "";
  if (!batch_id) return j({ ok:false, error:"missing_batch_id" }, 400);

  const ctype = String(request.headers.get("content-type") || "").toLowerCase();
  let rows = [];
  try {
    if (ctype.includes("text/plain")) {
      const text = await request.text();
      rows = csvToRows(text);
    } else {
      const body = await request.json();
      rows = Array.isArray(body) ? body : (Array.isArray(body?.rows) ? body.rows : []);
    }
  } catch {
    // ignore parse errors; rows will be empty
  }

  // Minimal validation: require 11 columns, non-empty brand name and domain
  let total = 0, valid = 0, invalid = 0;
  for (const r of rows) {
    total++;
    const ok = Array.isArray(r) && r.length >= 11 && String(r[0]||"").trim() && String(r[1]||"").trim();
    if (ok) valid++; else invalid++;
  }

  return j({ ok:true, batch_id, total, valid, invalid });
}

function csvToRows(text) {
  // Simple CSV parser that handles commas within quotes
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const out = [];
  for (const line of lines) {
    const row = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' ) {
        if (inQ && line[i+1] === '"') { cur += '"'; i++; }
        else { inQ = !inQ; }
      } else if (ch === ',' && !inQ) {
        row.push(cur); cur = "";
      } else {
        cur += ch;
      }
    }
    row.push(cur);
    out.push(row.map(s => s.trim()));
  }
  // Drop header if it looks like one
  if (out.length && headerLike(out[0])) out.shift();
  return out;
}

function headerLike(firstRow) {
  const joined = firstRow.join(",").toLowerCase();
  return joined.includes("brand") && joined.includes("domain");
}

function j(obj, status=200){
  return new Response(JSON.stringify(obj), {
    status, headers: { "content-type":"application/json" }
  });
}
