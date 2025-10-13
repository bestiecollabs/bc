import { ensureAdminOrThrow, json, nowIso } from "../_util_admin.js";

function normHost(u){
  try{ return new URL(u).host.toLowerCase(); } catch{ return null; }
}
function normShopify(u){
  if(!u) return null;
  const host = normHost(/^https?:\/\//i.test(u) ? u : `https://${u}`);
  if(!host) return null;
  return host.endsWith(".myshopify.com") ? host : host.replace(/^www\./,"");
}

// RFC4180-ish CSV parser. Handles quotes, commas, newlines.
function parseCSV(text){
  const out=[]; let row=[], field="", i=0, q=false;
  while(i<text.length){
    const c=text[i];
    if(q){
      if(c==='"' && text[i+1]==='"'){ field+='"'; i+=2; continue; }
      if(c==='"'){ q=false; i++; continue; }
      field+=c; i++; continue;
    }
    if(c==='"'){ q=true; i++; continue; }
    if(c===','){ row.push(field); field=""; i++; continue; }
    if(c==='\n'){ row.push(field); out.push(row); row=[]; field=""; i++; continue; }
    if(c==='\r'){ i++; continue; }
    field+=c; i++;
  }
  row.push(field); out.push(row);
  return out;
}

const COLS = [
  "name","slug","website_url","category_primary","category_secondary","category_tertiary",
  "instagram_url","tiktok_url","shopify_shop_domain","description","contact_email","logo_url",
  "status","featured","has_us_presence","is_dropshipper","notes_admin"
];

export async function onRequestPost(c){
  const { request, env } = c;
  ensureAdminOrThrow(request, env);

  // Accept multipart form-data (file input named "file") or raw text body
  let csvText = "";
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if(!file) return json(400, { ok:false, error:"file missing" });
    csvText = await file.text();
  } else {
    csvText = await request.text();
  }
  if(!csvText?.trim()) return json(400, { ok:false, error:"empty body" });

  const rows = parseCSV(csvText);
  if(rows.length < 2) return json(400, { ok:false, error:"no data rows" });

  // Header map
  const header = rows[0].map(h => String(h || "").trim().toLowerCase());
  const idx = Object.fromEntries(COLS.map(k => [k, header.indexOf(k)]));

  // Require minimum columns
  for (const req of ["name","slug","website_url","category_primary"]) {
    if (idx[req] === -1) return json(400, { ok:false, error:`missing required column: ${req}` });
  }

  let inserted = 0, updated = 0, skipped = 0, errors = 0;
  const problems = [];
  const now = nowIso();

  // Optional: ensure an index on slug exists for faster lookups
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug)").run();

  for (let r = 1; r < rows.length; r++){
    const rec = {};
    for(const k of COLS){
      const i = idx[k];
      rec[k] = i>=0 ? rows[r][i] : null;
    }
    if(!rec.name || !rec.slug || !rec.website_url || !rec.category_primary){
      skipped++; continue;
    }

    // Normalize types
    rec.featured = rec.featured ? Number(rec.featured) ? 1 : 0 : 0;
    rec.has_us_presence = rec.has_us_presence ? Number(rec.has_us_presence) ? 1 : 0 : 1;
    rec.is_dropshipper = rec.is_dropshipper ? Number(rec.is_dropshipper) ? 1 : 0 : 0;
    rec.status = (rec.status||"draft").toLowerCase();
    rec.website_host_norm = normHost(rec.website_url);
    rec.shopify_domain_norm = normShopify(rec.shopify_shop_domain || rec.website_url);

    try{
      // Upsert-by-slug (manual): check existence
      const existing = await env.DB.prepare("SELECT id FROM brands WHERE slug = ? LIMIT 1").bind(rec.slug).first();
      if(existing?.id){
        await env.DB.prepare(`
          UPDATE brands SET
            name=?, website_url=?, category_primary=?, category_secondary=?, category_tertiary=?,
            instagram_url=?, tiktok_url=?, shopify_shop_domain=?, description=?, contact_email=?, logo_url=?,
            status=?, featured=?, has_us_presence=?, is_dropshipper=?, notes_admin=?,
            website_host_norm=?, shopify_domain_norm=?, updated_at=?
          WHERE id=?`)
          .bind(
            rec.name, rec.website_url, rec.category_primary, rec.category_secondary, rec.category_tertiary,
            rec.instagram_url, rec.tiktok_url, rec.shopify_shop_domain, rec.description, rec.contact_email, rec.logo_url,
            rec.status, rec.featured, rec.has_us_presence, rec.is_dropshipper, rec.notes_admin,
            rec.website_host_norm, rec.shopify_domain_norm, now,
            existing.id
          ).run();
        updated++;
      } else {
        await env.DB.prepare(`
          INSERT INTO brands
            (name,slug,website_url,category_primary,category_secondary,category_tertiary,
             instagram_url,tiktok_url,shopify_shop_domain,description,contact_email,logo_url,
             status,featured,has_us_presence,is_dropshipper,notes_admin,
             website_host_norm,shopify_domain_norm,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, ?, ?)`)
          .bind(
            rec.name, rec.slug, rec.website_url, rec.category_primary, rec.category_secondary, rec.category_tertiary,
            rec.instagram_url, rec.tiktok_url, rec.shopify_shop_domain, rec.description, rec.contact_email, rec.logo_url,
            rec.status, rec.featured, rec.has_us_presence, rec.is_dropshipper, rec.notes_admin,
            rec.website_host_norm, rec.shopify_domain_norm, now, now
          ).run();
        inserted++;
      }
    } catch(e){
      errors++; problems.push({ row:r+1, slug:rec.slug, error:String(e) });
    }
  }

  return json(200, { ok:true, inserted, updated, skipped, errors, problems });
}
