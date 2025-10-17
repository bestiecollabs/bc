/**
 * POST /api/admin/brands/import
 * Accepts multipart/form-data with field "file" (CSV).
 * Query param ?dry=1 for dry-run.
 * Default status for new/updated rows: in_review
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://bestiecollabs.com",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
      "Access-Control-Allow-Headers": "content-type, x-admin-email"
    }
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const url = new URL(request.url);
    const dry = url.searchParams.get("dry") === "1";
    const form = await request.formData();
    const file = form.get("file");
    if (!file || !file.text) {
      return json({ ok:false, error:"missing_file" }, 400);
    }
    const csv = await file.text();
    const rows = parseCsv(csv);

    // Basic header check
    const required = ["name","slug","domain"];
    const headerOk = required.every(h => rows.header.includes(h));
    if (!headerOk) {
      return json({ ok:false, error:"invalid_csv_headers", required }, 400);
    }

    let inserted = 0, updated = 0, skipped = 0, errors = [];

    if (!dry) {
      const stmt = `
        INSERT INTO brands (name, slug, domain, status, is_public, category_primary, category_secondary, category_tertiary, website_url, logo_url, created_at, updated_at)
        VALUES (?1, ?2, ?3, 'in_review', 0, ?4, ?5, ?6, ?7, ?8, datetime('now'), datetime('now'))
        ON CONFLICT(slug) DO UPDATE SET
          name=excluded.name,
          domain=excluded.domain,
          category_primary=excluded.category_primary,
          category_secondary=excluded.category_secondary,
          category_tertiary=excluded.category_tertiary,
          website_url=excluded.website_url,
          logo_url=excluded.logo_url,
          status='in_review',
          is_public=0,
          updated_at=datetime('now')
      `;
      const ps = await env.DB.prepare(stmt);

      for (const r of rows.data) {
        try {
          // Coerce fields
          const name = (r.name||"").trim();
          const slug = (r.slug||"").trim().toLowerCase();
          const domain = (r.domain||"").trim().toLowerCase();
          if (!name || !slug || !domain) { skipped++; continue; }

          const category_primary = (r.category_primary||"").trim();
          const category_secondary = (r.category_secondary||"").trim();
          const category_tertiary = (r.category_tertiary||"").trim();
          const website_url = (r.website_url||"").trim();
          const logo_url = (r.logo_url||"").trim();

          const res = await ps.bind(
            name, slug, domain,
            category_primary, category_secondary, category_tertiary,
            website_url, logo_url
          ).run();

          // D1 returns meta; if changes==1 and existed we still can’t tell insert vs update reliably.
          // Treat any successful run as upsert. Count heuristically:
          if (res && typeof res.meta === "object") {
            updated++; // conservative
          } else {
            inserted++;
          }
        } catch (e) {
          errors.push({ slug: r.slug, error: String(e) });
        }
      }
    } else {
      // Dry run: just validate and count
      for (const r of rows.data) {
        if (r.name && r.slug && r.domain) inserted++; else skipped++;
      }
    }

    return json({ ok:true, dry, inserted, updated, skipped, errors });
  } catch (err) {
    return json({ ok:false, error:String(err) }, 500);
  }
}

function json(obj, status=200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type":"application/json; charset=utf-8",
      "Access-Control-Allow-Origin":"https://bestiecollabs.com",
      "Access-Control-Allow-Methods":"GET,POST,PATCH,OPTIONS",
      "Access-Control-Allow-Headers":"content-type, x-admin-email"
    }
  });
}

// Minimal CSV parser for UTF-8, header row required.
// Handles simple commas. For quoted fields with commas, use a real parser later.
function parseCsv(text) {
  const lines = text.replace(/\r\n/g,"\n").split("\n").filter(l=>l.trim().length);
  const header = lines[0].split(",").map(h=>h.trim().toLowerCase());
  const data = [];
  for (let i=1;i<lines.length;i++){
    const cols = lines[i].split(","); // simple split
    const row = {};
    header.forEach((h, idx)=> row[h] = (cols[idx]||"").trim());
    data.push(row);
  }
  return { header, data };
}
