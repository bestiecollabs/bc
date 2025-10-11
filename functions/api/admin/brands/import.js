/**
 * POST /api/admin/brands/import
 * Body: { rows: Array<BrandRow> }
 * Behavior: insert new rows; SKIP duplicates (no update). Case-insensitive on website_url and shopify_shop_domain.
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

        // duplicate check (case-insensitive)
        const find = await env.DB.prepare(`
          SELECT id FROM brands
          WHERE (website_url IS NOT NULL AND website_url <> '' AND LOWER(website_url)=?)
             OR (shopify_shop_domain IS NOT NULL AND shopify_shop_domain <> '' AND LOWER(shopify_shop_domain)=?)
          LIMIT 1
        `).bind(n.website_url_lc, n.shopify_shop_domain_lc).first();

        if (find && find.id) {
          skipped_duplicate++;        // do not update existing
          continue;
        }

        const ins = buildInsert(n);
        stmts.push(env.DB.prepare(ins.sql).bind(...ins.params));
        inserted++;
      }

      if (stmts.length) {
        const res = await env.DB.batch(stmts).catch(e => ({ error:e }));
        if (res && res.error) {
          // conservative: count whole batch as failed if batch throws
          failed += stmts.length;
        }
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
    if (["1","true","yes"].includes(s)) return 1;
    if (["0","false","no"].includes(s)) return 0;
    const n = parseInt(s,10); return Number.isFinite(n) ? n : 0;
  };
  const website_url = get("website_url");
  const shopify_shop_domain = get("shopify_shop_domain");

  return {
    name: get("name"),
    website_url,
    website_url_lc: website_url.toLowerCase(),
    category_primary: get("category_primary"),
    category_secondary: get("category_secondary"),
    category_tertiary: get("category_tertiary"),
    instagram_url: get("instagram_url"),
    tiktok_url: get("tiktok_url"),
    shopify_shop_domain,
    shopify_shop_domain_lc: shopify_shop_domain.toLowerCase(),
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
function buildInsert(n){
  const cols = [
    "name","website_url",
    "category_primary","category_secondary","category_tertiary",
    "instagram_url","tiktok_url",
    "shopify_shop_domain","shopify_shop_id","shopify_public_url",
    "contact_name","contact_title","contact_email","contact_phone",
    "country","state","city","zipcode","address",
    "description","support_email","logo_url",
    "featured","status","has_us_presence","is_dropshipper","notes_admin",
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
    now(), now()
  ];
  return { sql: `INSERT INTO brands (${cols.join(",")}) VALUES (${cols.map(()=>"?").join(",")})`, params };
}
function now(){ return new Date().toISOString(); }
function json(obj, status=200){ return new Response(JSON.stringify(obj), { status, headers:{ "content-type":"application/json; charset=utf-8" } }); }
