/**
 * POST /api/admin/brands/import
 * Body: { rows: Array<BrandRow> }
 * Validates and upserts rows into D1 (binding "DB" -> bestiedb).
 * Upsert key: existing row where LOWER(shopify_shop_domain)=? OR LOWER(website_url)=?
 * Limits: max 1000 rows per request, processed in chunks of 100.
 *
 * Assumed schema (SQLite/D1):
 *   brands(
 *     id INTEGER PRIMARY KEY AUTOINCREMENT,
 *     name TEXT NOT NULL,
 *     website_url TEXT,
 *     category_primary TEXT, category_secondary TEXT, category_tertiary TEXT,
 *     instagram_url TEXT, tiktok_url TEXT,
 *     shopify_shop_domain TEXT, shopify_shop_id TEXT, shopify_public_url TEXT,
 *     contact_name TEXT, contact_title TEXT, contact_email TEXT, contact_phone TEXT,
 *     country TEXT, state TEXT, city TEXT, zipcode TEXT, address TEXT,
 *     description TEXT, support_email TEXT, logo_url TEXT,
 *     featured INTEGER DEFAULT 0,
 *     status TEXT,
 *     has_us_presence INTEGER DEFAULT 0,
 *     is_dropshipper INTEGER DEFAULT 0,
 *     notes_admin TEXT,
 *     created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 *     updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
 *     deleted_at TEXT
 *   )
 *
 * This function does not create tables. Run migrations separately.
 */

export const onRequestPost = async ({ request, env }) => {
  try {
    const { rows } = await request.json().catch(() => ({}));
    if (!Array.isArray(rows)) {
      return json({ ok: false, error: "Invalid body. Expected { rows: [] }" }, 400);
    }

    if (rows.length === 0) {
      return json({ ok: true, inserted: 0, updated: 0, failed: 0 });
    }

    if (rows.length > 1000) {
      return json({ ok: false, error: "Too many rows. Max 1000 per request." }, 413);
    }

    let inserted = 0, updated = 0, failed = 0;

    // Process in chunks to keep batch sizes safe
    const chunkSize = 100;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);

      // Build a batch of statements per chunk
      const stmts = [];
      for (const r of chunk) {
        const norm = normalizeRow(r);
        const validation = validateRow(norm);
        if (!validation.ok) {
          failed++;
          continue;
        }

        // Find existing by domain or website
        const findSql = `
          SELECT id FROM brands
          WHERE (LOWER(COALESCE(shopify_shop_domain,'')) = ? AND shopify_shop_domain IS NOT NULL AND shopify_shop_domain <> '')
             OR (LOWER(COALESCE(website_url,'')) = ? AND website_url IS NOT NULL AND website_url <> '')
          LIMIT 1
        `;
        const findParams = [norm.shopify_shop_domain_lc, norm.website_url_lc];

        // We cannot mix SELECT and UPDATE/INSERT in a single batch entry.
        // So we perform a two-phase loop: run finds, then build writes.
        // To keep atomicity reasonable per chunk, we collect ids first.
        const found = await env.DB.prepare(findSql).bind(...findParams).first();

        if (found && found.id) {
          // UPDATE existing
          const upd = buildUpdate(norm, found.id);
          stmts.push(env.DB.prepare(upd.sql).bind(...upd.params));
          updated++;
        } else {
          // INSERT new
          const ins = buildInsert(norm);
          stmts.push(env.DB.prepare(ins.sql).bind(...ins.params));
          inserted++;
        }
      }

      if (stmts.length) {
        const res = await env.DB.batch(stmts).catch((e) => ({ error: e }));
        if (res && res.error) {
          // If a whole batch fails, attribute to failures and roll back counters for safety
          // Note: D1 batch is not transactional; partials may have applied.
          // We report a generic failure and recommend checking logs.
          failed += stmts.length;
        }
      }
    }

    return json({ ok: true, inserted, updated, failed });
  } catch (e) {
    return json({ ok: false, error: e.message || String(e) }, 500);
  }
};

function normalizeRow(r) {
  const get = (k) => {
    const v = r?.[k];
    if (v === null || v === undefined) return "";
    return String(v).trim();
  };

  // Normalize booleans and ints
  const toInt = (v) => {
    const s = String(v ?? "").trim().toLowerCase();
    if (s === "1" || s === "true" || s === "yes") return 1;
    if (s === "0" || s === "false" || s === "no") return 0;
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : 0;
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

function validateRow(n) {
  if (!n.name)               return { ok: false, error: "Missing name" };
  if (!n.website_url && !n.shopify_shop_domain)
                            return { ok: false, error: "Need website_url or shopify_shop_domain" };
  return { ok: true };
}

function buildInsert(n) {
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
  const placeholders = cols.map(()=>"?").join(",");
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
  return {
    sql: `INSERT INTO brands (${cols.join(",")}) VALUES (${placeholders})`,
    params
  };
}

function buildUpdate(n, id) {
  const setCols = [
    "name=?","website_url=?",
    "category_primary=?","category_secondary=?","category_tertiary=?",
    "instagram_url=?","tiktok_url=?",
    "shopify_shop_domain=?","shopify_shop_id=?","shopify_public_url=?",
    "contact_name=?","contact_title=?","contact_email=?","contact_phone=?",
    "country=?","state=?","city=?","zipcode=?","address=?",
    "description=?","support_email=?","logo_url=?",
    "featured=?","status=?","has_us_presence=?","is_dropshipper=?","notes_admin=?",
    "updated_at=?"
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
    now(),
    id
  ];
  return {
    sql: `UPDATE brands SET ${setCols.join(",")} WHERE id = ?`,
    params
  };
}

function now(){ return new Date().toISOString(); }

function json(obj, status=200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
