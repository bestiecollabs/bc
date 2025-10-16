/**
 * POST /api/admin/brands
 * Inserts new rows only. Skips duplicates.
 * Duplicate key = website_host_norm OR shopify_domain_norm (normalized).
 * Response: { ok, inserted, skipped_duplicate, failed }
 */
export const onRequestPost = async ({ request, env }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const rows = Array.isArray(body.rows) ? body.rows : null;
    if (!rows) return json({ ok:false, error:"Invalid body. Expected { rows: [] }" }, 400);
    if (rows.length === 0) return json({ ok:true, inserted:0, skipped_duplicate:0, failed:0 });
    if (rows.length > 1000) return json({ ok:false, error:"Too many rows. Max 1000" }, 413);

    let inserted = 0, failed = 0, skipped_duplicate = 0;
    const chunkSize = 100;

    for (let i=0;i<rows.length;i+=chunkSize) {
      const chunk = rows.slice(i, i+chunkSize);
      const stmts = [];

      for (const r of chunk) {
        const n = normalizeRow(r);
        const v = validateRow(n);
        if (!v.ok) { failed++; continue; }

        // Compute normalized keys
        const website_host_norm = normWebsiteHost(n.website_url);
        const shopify_domain_norm = normDomain(n.shopify_shop_domain);

        // Skip if duplicate exists
        const found = await env.DB.prepare(`
          SELECT id FROM brands
          WHERE (website_host_norm IS NOT NULL AND website_host_norm <> '' AND website_host_norm = ?)
             OR (shopify_domain_norm IS NOT NULL AND shopify_domain_norm <> '' AND shopify_domain_norm = ?)
          LIMIT 1
        `).bind(website_host_norm, shopify_domain_norm).first();

        if (found && found.id) { skipped_duplicate++; continue; }

        const ins = buildInsert(n, website_host_norm, shopify_domain_norm);
        stmts.push(env.DB.prepare(ins.sql).bind(...ins.params));
        inserted++;
      }

      if (stmts.length) {
        const res = await env.DB.batch(stmts).catch(e => ({ error:e }));
        if (res && res.error) { failed += stmts.length; }
      }
    }

    return json({ ok:true, inserted, skipped_duplicate, failed });
  } catch (e) {
    return json({ ok:false, error:e.message || String(e) }, 500);
  }
};

function normalizeRow(r){
  const get = k => (r?.[k] == null ? "" : String(r[k]).trim());
  const toInt = v => {
    const s = String(v ?? "").trim().toLowerCase();
    if (["1","true","yes","y"].includes(s)) return 1;
    if (["0","false","no","n"].includes(s)) return 0;
    const n = parseInt(s,10); return Number.isFinite(n) ? n : 0;
  };
  return {
    name: get("name"),
    website_url: get("website_url"),
    category_primary: get("category_primary"),
    category_secondary: get("category_secondary"),
    category_tertiary: get("category_tertiary"),
    instagram_url: get("instagram_url"),
    tiktok_url: get("tiktok_url"),
    shopify_shop_domain: get("shopify_shop_domain"),
    shopify_shop_id: get("shopify_shop_id"),
    shopify_public_url: get("shopify_public_url"),
    contact_name: get("contact_name"),
    contact_title: get("contact_title"),
    contact_email: get("contact_email"),
    contact_phone: get("contact_phone"),
    country: get("country"),
    state: get("state"),
    city: get("city"),
    zipcode: get("zipcode"),
    address: get("address"),
    description: get("description"),
    support_email: get("support_email"),
    logo_url: get("logo_url"),
    featured: toInt(get("featured")),
    status: get("status") || "draft",
    has_us_presence: toInt(get("has_us_presence")),
    is_dropshipper: toInt(get("is_dropshipper")),
    notes_admin: get("notes_admin"),
  };
}
function validateRow(n){
  if (!n.name) return { ok:false, error:"Missing name" };
  if (!n.website_url && !n.shopify_shop_domain) return { ok:false, error:"Need website_url or shopify_shop_domain" };
  return { ok:true };
}

function normWebsiteHost(url){
  if (!url) return "";
  try {
    // ensure URL object by adding scheme if missing
    const u = new URL(url.includes("://") ? url : ("https://" + url));
    return normDomain(u.hostname);
  } catch {
    // fallback: strip protocol, take up to first slash
    let s = String(url).trim().toLowerCase();
    s = s.replace(/^https?:\/\//,'').replace(/\/+.*$/,''); // remove path
    return normDomain(s);
  }
}
function normDomain(host){
  if (!host) return "";
  let h = String(host).trim().toLowerCase();
  if (h.startsWith("www.")) h = h.slice(4);
  // drop trailing dot
  if (h.endsWith(".")) h = h.slice(0,-1);
  return h;
}

function buildInsert(n, website_host_norm, shopify_domain_norm){
  const cols = [
    "name","website_url",
    "category_primary","category_secondary","category_tertiary",
    "instagram_url","tiktok_url",
    "shopify_shop_domain","shopify_shop_id","shopify_public_url",
    "contact_name","contact_title","contact_email","contact_phone",
    "country","state","city","zipcode","address",
    "description","support_email","logo_url",
    "featured","status","has_us_presence","is_dropshipper","notes_admin",
    "website_host_norm","shopify_domain_norm",
    "created_at","updated_at"
  ];
  const params = [
    n.name, n.website_url,
    n.category_primary, n.category_secondary, n.category_tertiary,
    n.instagram_url, n.tiktok_url,
    n.shopify_shop_domain, n.shopify_shop_id, n.shopify_public_url,
    n.contact_name, n.contact_title, n.contact_email, n.contact_phone,
    n.country, n.state, n.city, n.zipcode, n.address,
    n.description, n.support_email, n.logo_url,
    n.featured, n.status, n.has_us_presence, n.is_dropshipper, n.notes_admin,
    website_host_norm || null, shopify_domain_norm || null,
    now(), now()
  ];
  return { sql: `INSERT INTO brands (${cols.join(",")}) VALUES (${cols.map(()=>"?").join(",")})`, params };
}

function now(){ return new Date().toISOString(); }
function json(obj, status=200){ return new Response(JSON.stringify(obj), { status, headers:{ "content-type":"application/json; charset=utf-8" } }); }

