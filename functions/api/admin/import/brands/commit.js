import { ACCEPTED_HEADERS_11 } from './_headers.js';
export const onRequestPost = async (context) => {
  const { request, env } = context;
  const db = env.DB || env.bestiedb;

  const allowlist = String(env.ADMIN_ALLOWLIST || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const actor = String(request.headers.get("x-admin-email") || "").toLowerCase();
  if (!actor || (allowlist.length && !allowlist.includes(actor))) {
    return json({ ok:false, error:"forbidden" }, 403);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok:false, error:"invalid_json" }, 400);
  }

  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  if (!rows.length) return json({ ok:false, error:"no_rows" }, 400);

  const required = ["brand_name","website_url","category_primary","description","us_based"];
  for (const r of rows) {
    for (const k of required) {
      if (r[k] === undefined || r[k] === null || String(r[k]).trim() === "") {
        return json({ ok:false, error:"missing_required", field:k }, 400);
      }
    }
  }

  const nowIso = new Date().toISOString();
  let inserted = 0, updated = 0, skipped = 0, errors = 0;
  const results = [];

  for (const r of rows) {
    try {
      const name = String(r.brand_name).trim();
      const website = String(r.website_url || "").trim();
      const websiteLower = website.toLowerCase();

      const found = await db.prepare(
        `SELECT id FROM brands WHERE website_url IS NOT NULL AND LOWER(website_url)=? LIMIT 1`
      ).bind(websiteLower).first();

      if (!found) {
        await db.prepare(`
          INSERT INTO brands
            (name, website_url, category_primary, category_secondary, category_tertiary,
             instagram_url, tiktok_url, description, has_us_presence, is_dropshipper,
             status, created_at, updated_at)
          VALUES (?,?,?,?,?,
                  ?,?,?,?,?, 'draft', ?, ?)
        `).bind(
          name,
          website || null,
          val(r.category_primary),
          val(r.category_secondary),
          val(r.category_tertiary),
          val(r.instagram_url),
          val(r.tiktok_url),
          val(r.description),
          truthy(r.us_based) ? 1 : 0,
          0,
          nowIso, nowIso
        ).run();
        inserted++;
        results.push({ action:"insert", website: websiteLower });
      } else {
        await db.prepare(`
          UPDATE brands
             SET name=?,
                 category_primary=?,
                 category_secondary=?,
                 category_tertiary=?,
                 instagram_url=?,
                 tiktok_url=?,
                 description=?,
                 has_us_presence=?,
                 updated_at=?
           WHERE id=?
        `).bind(
          name,
          val(r.category_primary),
          val(r.category_secondary),
          val(r.category_tertiary),
          val(r.instagram_url),
          val(r.tiktok_url),
          val(r.description),
          truthy(r.us_based) ? 1 : 0,
          nowIso,
          found.id
        ).run();
        updated++;
        results.push({ action:"update", id: found.id, website: websiteLower });
      }
    } catch (e) {
      errors++;
      results.push({ action:"error", message: String(e?.message || e) });
    }
  }

  return json({ ok:true, summary:{ inserted, updated, skipped, errors }, results });
};

function val(s){ const t = String(s ?? "").trim(); return t ? t : null; }
function truthy(v){ return String(v).trim().toLowerCase() === "true" || String(v).trim() === "1" || String(v).trim().toLowerCase() === "yes"; }
function json(b,s=200){ return new Response(JSON.stringify(b),{ status:s, headers:{ "content-type":"application/json" } }); }

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "content-type"
    }
  });
}
