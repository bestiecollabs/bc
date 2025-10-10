/**
 * /api/admin/import/brands
 * Accepts POST only. Content-Type: text/csv or multipart/form-data (field "file")
 */
export const onRequest = async (ctx) => {
  const { request, env } = ctx;
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok:false, error:"method_not_allowed" }), {
      status: 405, headers: { "content-type": "application/json" }
    });
  }

  const admin = request.headers.get("x-admin-email");
  if (!admin) return json({ ok:false, error:"unauthorized" }, 401);

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry_run") === "1";

  const ct = (request.headers.get("content-type")||"").toLowerCase();
  let csvText = "";

  if (ct.includes("text/csv") || ct.startsWith("application/octet-stream")) {
    csvText = await request.text();
  } else if (ct.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file.text !== "function") {
      return json({ ok:false, error:"missing file" }, 400);
    }
    csvText = await file.text();
  } else {
    return json({ ok:false, error:"unsupported content-type" }, 400);
  }

  const rows = parseCSV(csvText);
  if (rows.length === 0) return json({ ok:false, error:"empty csv" }, 400);

  const { valid, errors, batchId } = await validateAndNormalize(rows, env);
  if (dryRun) {
    return json({
      ok: true,
      dry_run: true,
      counts: { total: rows.length, valid: valid.length, errors: errors.length },
      errors: errors.slice(0, 50),
      sample: valid.slice(0, 20),
      batch_preview_id: batchId
    });
  }

  const db = env.DB;
  let inserted = 0, updated = 0, rejected = 0;
  for (const v of valid) {
    try {
      const res = await upsertBrand(db, { ...v, import_batch_id: batchId });
      const changes = (res?.meta?.changes ?? res?.changed ?? 0);
      if (changes > 0 && (res?.lastRowId ?? res?.last_row_id)) inserted++;
      else updated++;
    } catch (e) {
      rejected++;
      errors.push({ row_number: v._row, field: "*", reason: "db_error", detail: String(e) });
    }
  }

  return json({
    ok: true,
    dry_run: false,
    batch_id: batchId,
    counts: { total: rows.length, inserted, updated, rejected, errors: errors.length },
    errors: errors.slice(0, 100)
  });
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

// CSV parsing
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim().length>0);
  if (lines.length === 0) return [];
  const headers = splitCSVLine(lines[0]).map(h => h.trim());
  const out = [];
  for (let i=1;i<lines.length;i++) {
    const cols = splitCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => row[h] = (cols[idx] ?? "").trim());
    row._row = i+1;
    out.push(row);
  }
  return out;
}
function splitCSVLine(line) {
  const res = [];
  let cur = "", inQ = false;
  for (let i=0;i<line.length;i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i+1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += c;
    } else {
      if (c === ',') { res.push(cur); cur = ""; }
      else if (c === '"') inQ = true;
      else cur += c;
    }
  }
  res.push(cur);
  return res;
}

const REQUIRED = ["name","website_url","category_primary","status","has_us_presence","is_dropshipper"];
const STATUS_SET = new Set(["draft","published"]);
const BOOL = v => v === "1" || v === 1 || v === true || String(v).toLowerCase()==="true" ? 1 : 0;

function validateAndNormalize(rows) {
  const errors = [];
  const valid = [];
  const seenSlugs = new Set();
  const batchId = `brands_${Date.now()}`;

  for (const r of rows) {
    let bad = false;
    for (const k of REQUIRED) {
      if (!String(r[k] ?? "").trim()) { errors.push(err(r,"required",k,"missing")); bad = true; }
    }
    if (bad) continue;

    if (!STATUS_SET.has(String(r.status).toLowerCase())) { errors.push(err(r,"status","status","must be draft or published")); bad = true; }

    const hasUS = BOOL(r.has_us_presence);
    const isDrop = BOOL(r.is_dropshipper);
    if (hasUS !== 1) { errors.push(err(r,"has_us_presence","has_us_presence","must be 1 (US presence required)")); bad = true; }
    if (isDrop !== 0) { errors.push(err(r,"is_dropshipper","is_dropshipper","must be 0 (dropshippers not allowed)")); bad = true; }

    const website_url = canonicalUrl(r.website_url);
    if (!website_url) { errors.push(err(r,"website_url","website_url","invalid url")); bad = true; }
    if (bad) continue;

    const domain = extractDomain(website_url);
    const slug = slugify(r.name);
    if (seenSlugs.has(slug)) { errors.push(err(r,"slug","name","duplicate derived slug in file")); continue; }
    seenSlugs.add(slug);

    const normalized = {
      name: r.name.trim(),
      slug,
      domain,
      website_url,
      category_primary: r.category_primary.trim(),
      category_secondary: (r.category_secondary||"").trim() || null,
      category_tertiary: (r.category_tertiary||"").trim() || null,
      instagram_url: canonicalSocial(r.instagram_url, "instagram"),
      tiktok_url: canonicalSocial(r.tiktok_url, "tiktok"),
      shopify_shop_domain: (r.shopify_shop_domain||"").trim() || null,
      description: (r.description||"").trim() || null,
      contact_email: (r.contact_email||"").trim() || null,
      logo_url: canonicalUrl(r.logo_url),
      status: String(r.status).toLowerCase(),
      featured: BOOL(r.featured),
      has_us_presence: 1,
      is_dropshipper: 0,
      _row: r._row
    };
    valid.push(normalized);
  }
  return { valid, errors, batchId };
}

function err(r, field, code, reason) {
  return { row_number: r._row, field, code, reason };
}

function canonicalUrl(u) {
  if (!u) return null;
  try {
    const url = new URL(String(u).trim());
    if (!/^https?:/.test(url.protocol)) return null;
    return url.toString();
  } catch { return null; }
}
function extractDomain(website_url) {
  try {
    const u = new URL(website_url);
    const h = u.hostname.toLowerCase();
    return h.startsWith("www.") ? h.slice(4) : h;
  } catch { return null; }
}
function canonicalSocial(u, platform) {
  if (!u) return null;
  try {
    const url = new URL(u);
    const host = url.hostname.toLowerCase();
    if (platform === "instagram" && !host.includes("instagram.")) return null;
    if (platform === "tiktok" && !host.includes("tiktok.")) return null;
    return url.toString();
  } catch { return null; }
}
function slugify(s) {
  return String(s||"").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g,"-").replace(/(^-+|-+$)/g,"");
}

async function upsertBrand(db, v) {
  const now = new Date().toISOString();
  const sql = `
  INSERT INTO brands
  (name, slug, domain, website_url, category_primary, category_secondary, category_tertiary,
   instagram_url, tiktok_url, shopify_shop_domain, description, contact_email, logo_url,
   status, featured, has_us_presence, is_dropshipper, import_batch_id, created_at, updated_at)
  VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20)
  ON CONFLICT(domain) DO UPDATE SET
    name=excluded.name,
    slug=excluded.slug,
    website_url=excluded.website_url,
    category_primary=excluded.category_primary,
    category_secondary=excluded.category_secondary,
    category_tertiary=excluded.category_tertiary,
    instagram_url=excluded.instagram_url,
    tiktok_url=excluded.tiktok_url,
    shopify_shop_domain=excluded.shopify_shop_domain,
    description=excluded.description,
    contact_email=excluded.contact_email,
    logo_url=excluded.logo_url,
    status=excluded.status,
    featured=excluded.featured,
    has_us_presence=excluded.has_us_presence,
    is_dropshipper=excluded.is_dropshipper,
    import_batch_id=excluded.import_batch_id,
    updated_at=excluded.updated_at
  `;
  const res = await db.prepare(sql).bind(
    v.name, v.slug, v.domain, v.website_url, v.category_primary, v.category_secondary, v.category_tertiary,
    v.instagram_url, v.tiktok_url, v.shopify_shop_domain, v.description, v.contact_email, v.logo_url,
    v.status, v.featured, v.has_us_presence, v.is_dropshipper, v.import_batch_id, now, now
  ).run();
  return res;
}

