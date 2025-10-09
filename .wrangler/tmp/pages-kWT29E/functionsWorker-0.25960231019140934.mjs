var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// api/admin/chipchip/_lib/db.js
var db_exports = {};
__export(db_exports, {
  assertAdmin: () => assertAdmin,
  csvResponse: () => csvResponse,
  getByIds: () => getByIds,
  json: () => json,
  makePublicCode: () => makePublicCode,
  normalizeWebsite: () => normalizeWebsite,
  notFound: () => notFound,
  nowSec: () => nowSec,
  q: () => q,
  run: () => run,
  ulid: () => ulid
});
function assertAdmin(env, request) {
  const email = request.headers.get("Cf-Access-Authenticated-User-Email") || request.headers.get("x-admin-email");
  if (!email) return null;
  const list = String(env.ADMIN_ALLOWLIST || "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
  return list.includes(email.toLowerCase()) ? email : null;
}
function json(data, status = 200, headers = {}) {
  const safeStatus = Number.isInteger(status) && status >= 200 && status <= 599 ? status : 500;
  return new Response(JSON.stringify(data ?? {}), {
    status: safeStatus,
    headers: { "content-type": "application/json; charset=utf-8", ...headers }
  });
}
function notFound() {
  return new Response("Not found", { status: 404 });
}
async function q(db, sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const bound = params && params.length ? stmt.bind(...params) : stmt;
    return await bound.all();
  } catch (e) {
    console.error("D1 q() error:", e);
    return { results: [], error: e.message };
  }
}
async function run(db, sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const bound = params && params.length ? stmt.bind(...params) : stmt;
    return await bound.run();
  } catch (e) {
    console.error("D1 run() error:", e);
    return { success: false, error: e.message };
  }
}
function nowSec() {
  return Math.floor(Date.now() / 1e3);
}
function ulid() {
  const t = Date.now().toString(36);
  const r = Array.from({ length: 16 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
  return (t + r).slice(0, 26);
}
function csvResponse(name, header, rows) {
  const esc3 = /* @__PURE__ */ __name((v) => {
    if (v === null || v === void 0) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }, "esc");
  const csv = [header.join(","), ...rows.map((r) => r.map(esc3).join(","))].join("\n");
  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${name}"`
    }
  });
}
async function getByIds(db, table, ids) {
  if (!ids?.length) return [];
  const qMarks = ids.map(() => "?").join(",");
  const res = await q(db, `SELECT * FROM ${table} WHERE id IN (${qMarks})`, ids);
  return res?.results ?? [];
}
function normalizeWebsite(input) {
  if (!input) return "";
  let s = String(input).trim();
  s = s.replace(/^mailto:/i, "").replace(/^tel:/i, "");
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    u.hostname = u.hostname.toLowerCase();
    if (!u.pathname || u.pathname === "/") u.pathname = "";
    u.hash = "";
    u.search = "";
    let out = u.toString();
    if (out.endsWith("/") && u.pathname === "") out = out.slice(0, -1);
    return out;
  } catch {
    return s;
  }
}
function makePublicCode(name, opts = {}) {
  const minLen = opts.minLen ?? 3;
  const base = String(name || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const slug = base.length >= minLen ? base : "id-" + Math.random().toString(36).slice(2, 8);
  return slug.slice(0, 64);
}
var init_db = __esm({
  "api/admin/chipchip/_lib/db.js"() {
    init_functionsRoutes_0_7656062869946563();
    __name(assertAdmin, "assertAdmin");
    __name(json, "json");
    __name(notFound, "notFound");
    __name(q, "q");
    __name(run, "run");
    __name(nowSec, "nowSec");
    __name(ulid, "ulid");
    __name(csvResponse, "csvResponse");
    __name(getByIds, "getByIds");
    __name(normalizeWebsite, "normalizeWebsite");
    __name(makePublicCode, "makePublicCode");
  }
});

// api/admin/chipchip/_lib/csv.js
async function readCSV(request) {
  const text = await request.text();
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.length);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseLine(lines[0]).map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (cols[idx] ?? "").trim();
    });
    rows.push(obj);
  }
  return { headers, rows };
}
function parseLine(line) {
  const out = [];
  let i = 0, cur = "", inQ = false;
  while (i < line.length) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQ = false;
        i++;
        continue;
      }
      cur += c;
      i++;
      continue;
    } else {
      if (c === '"') {
        inQ = true;
        i++;
        continue;
      }
      if (c === ",") {
        out.push(cur);
        cur = "";
        i++;
        continue;
      }
      cur += c;
      i++;
      continue;
    }
  }
  out.push(cur);
  return out;
}
var init_csv = __esm({
  "api/admin/chipchip/_lib/csv.js"() {
    init_functionsRoutes_0_7656062869946563();
    __name(readCSV, "readCSV");
    __name(parseLine, "parseLine");
  }
});

// api/admin/chipchip/import/brands.js
async function onRequest({ env, request }) {
  const email = assertAdmin(env, request);
  if (!email) return notFound();
  if (request.method !== "POST") return notFound();
  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "true";
  const { headers, rows } = await readCSV(request);
  const miss = EXPECT.filter((h) => !headers.includes(h));
  if (miss.length) return json({ error: "missing headers", missing: miss }, 400);
  const ts = nowSec();
  const batchId = ulid();
  if (!dryRun) {
    await run(
      env.DB,
      `INSERT INTO admin_batches(id, actor_email, action, meta_json, created_at) VALUES(?,?,?,?,?)`,
      [batchId, email, "import_brands", JSON.stringify({ count: rows.length }), ts]
    );
  }
  const errors = [];
  let inserted = 0, updated = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const name = (r["brand_name"] || "").trim();
    if (!name) {
      errors.push({ row: i + 1, error: "brand_name required" });
      continue;
    }
    const websiteNorm = normalizeWebsite((r["website"] || "").trim() || null);
    const brand_name_lower = name.toLowerCase();
    const id = (r["id"] || "").trim() || ulid();
    const public_code = makePublicCode("5");
    const N = /* @__PURE__ */ __name((k) => {
      const v = (r[k] ?? "").trim();
      return v === "" || /^unknown$/i.test(v) ? null : v;
    }, "N");
    const params = [
      id,
      public_code,
      name,
      brand_name_lower,
      N("website"),
      websiteNorm,
      N("shortDesc"),
      N("category_1"),
      N("category_2"),
      N("category_3"),
      N("public_contact"),
      N("reviews_total") ? Number(N("reviews_total")) : null,
      N("rating_avg") ? Number(N("rating_avg")) : null,
      N("priceRange"),
      N("estimated_monthly"),
      N("customer_age_range"),
      N("customer_sex"),
      N("social_platform_1"),
      N("social_platform_2"),
      N("top_creator_videos_1"),
      N("top_creator_videos_2"),
      N("last_seen"),
      dryRun ? null : batchId,
      nowSec(),
      nowSec()
    ];
    const SQL_SITE = `INSERT INTO directory_brands
      (id, public_code, brand_name, brand_name_lower, website, website_normalized, shortDesc,
       category_1, category_2, category_3, public_contact, reviews_total, rating_avg, priceRange,
       estimated_monthly, customer_age_range, customer_sex, social_platform_1, social_platform_2,
       top_creator_videos_1, top_creator_videos_2, last_seen, import_batch_id, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(website_normalized) DO UPDATE SET
        brand_name=excluded.brand_name,
        brand_name_lower=excluded.brand_name_lower,
        shortDesc=excluded.shortDesc,
        category_1=excluded.category_1, category_2=excluded.category_2, category_3=excluded.category_3,
        public_contact=excluded.public_contact,
        reviews_total=excluded.reviews_total,
        rating_avg=excluded.rating_avg,
        priceRange=excluded.priceRange,
        estimated_monthly=excluded.estimated_monthly,
        customer_age_range=excluded.customer_age_range,
        customer_sex=excluded.customer_sex,
        social_platform_1=excluded.social_platform_1,
        social_platform_2=excluded.social_platform_2,
        top_creator_videos_1=excluded.top_creator_videos_1,
        top_creator_videos_2=excluded.top_creator_videos_2,
        last_seen=excluded.last_seen,
        import_batch_id=${dryRun ? "import_batch_id" : "excluded.import_batch_id"},
        updated_at=excluded.updated_at`;
    const SQL_NAME = `INSERT INTO directory_brands
      (id, public_code, brand_name, brand_name_lower, website, website_normalized, shortDesc,
       category_1, category_2, category_3, public_contact, reviews_total, rating_avg, priceRange,
       estimated_monthly, customer_age_range, customer_sex, social_platform_1, social_platform_2,
       top_creator_videos_1, top_creator_videos_2, last_seen, import_batch_id, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(brand_name_lower) DO UPDATE SET
        shortDesc=excluded.shortDesc,
        category_1=excluded.category_1, category_2=excluded.category_2, category_3=excluded.category_3,
        public_contact=excluded.public_contact,
        reviews_total=excluded.reviews_total,
        rating_avg=excluded.rating_avg,
        priceRange=excluded.priceRange,
        estimated_monthly=excluded.estimated_monthly,
        customer_age_range=excluded.customer_age_range,
        customer_sex=excluded.customer_sex,
        social_platform_1=excluded.social_platform_1,
        social_platform_2=excluded.social_platform_2,
        top_creator_videos_1=excluded.top_creator_videos_1,
        top_creator_videos_2=excluded.top_creator_videos_2,
        last_seen=excluded.last_seen,
        import_batch_id=${dryRun ? "import_batch_id" : "excluded.import_batch_id"},
        updated_at=excluded.updated_at`;
    try {
      if (!dryRun) {
        if (websiteNorm) await run(env.DB, SQL_SITE, params);
        else await run(env.DB, SQL_NAME, params);
      }
      inserted++;
    } catch (e) {
      try {
        if (!dryRun) await run(env.DB, SQL_NAME, params);
        updated++;
      } catch (e2) {
        errors.push({ row: i + 1, error: e2.message || String(e2) });
      }
    }
  }
  return json({ dryRun, batch_id: dryRun ? null : batchId, inserted, updated, errors });
}
var EXPECT;
var init_brands = __esm({
  "api/admin/chipchip/import/brands.js"() {
    init_functionsRoutes_0_7656062869946563();
    init_db();
    init_csv();
    EXPECT = ["id", "brand_name", "website", "shortDesc", "category_1", "category_2", "category_3", "public_contact", "reviews_total", "rating_avg", "priceRange", "estimated_monthly", "customer_age_range", "customer_sex", "social_platform_1", "social_platform_2", "top_creator_videos_1", "top_creator_videos_2", "last_seen"];
    __name(onRequest, "onRequest");
  }
});

// api/admin/chipchip/import/creators.js
async function onRequest2({ env, request }) {
  const email = assertAdmin(env, request);
  if (!email) return notFound();
  if (request.method !== "POST") return notFound();
  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "true";
  const { headers, rows } = await readCSV(request);
  const miss = EXPECT2.filter((h) => !headers.includes(h));
  if (miss.length) return json({ error: "missing headers", missing: miss }, 400);
  const ts = nowSec();
  const batchId = ulid();
  if (!dryRun) {
    await run(
      env.DB,
      `INSERT INTO admin_batches(id, actor_email, action, meta_json, created_at)
                       VALUES(?,?,?,?,?)`,
      [batchId, email, "import_creators", JSON.stringify({ count: rows.length }), ts]
    );
  }
  const errors = [];
  let upserts = 0, updates = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const handle = (r["handle"] || "").trim();
    const handle_lower = handle ? handle.toLowerCase() : null;
    if (!handle_lower && !r["tiktok_user_id"] && !r["instagram_user_id"]) {
      errors.push({ row: i + 1, error: "handle or platform id required" });
      continue;
    }
    const N = /* @__PURE__ */ __name((name) => {
      const v = (r[name] ?? "").trim();
      return v === "" || /^unknown$/i.test(v) ? null : v;
    }, "N");
    const id = ulid();
    const public_code = makePublicCode("3");
    const platform = r["tiktok_user_id"] && r["instagram_user_id"] ? "mixed" : r["tiktok_user_id"] ? "tiktok" : r["instagram_user_id"] ? "instagram" : "unknown";
    const now = nowSec();
    const params = [
      id,
      public_code,
      platform,
      handle,
      handle_lower,
      N("tiktok_user_id"),
      N("instagram_user_id"),
      N("email"),
      N("audience_country"),
      N("followers_total") ? Number(N("followers_total")) : null,
      N("avg_weekly_posts") ? Number(N("avg_weekly_posts")) : null,
      N("engagement_rate") ? Number(N("engagement_rate")) : null,
      N("avg_views") ? Number(N("avg_views")) : null,
      N("avg_likes") ? Number(N("avg_likes")) : null,
      N("avg_comments") ? Number(N("avg_comments")) : null,
      N("avg_shares") ? Number(N("avg_shares")) : null,
      N("audience_category_1"),
      N("audience_category_2"),
      N("audience_category_3"),
      N("audience_age_range"),
      N("audience_sex"),
      N("audience_location"),
      N("last_active"),
      N("tiktok_followers") ? Number(N("tiktok_followers")) : null,
      N("tiktok_avg_views") ? Number(N("tiktok_avg_views")) : null,
      N("tiktok_avg_likes") ? Number(N("tiktok_avg_likes")) : null,
      N("tiktok_avg_comments") ? Number(N("tiktok_avg_comments")) : null,
      N("tiktok_avg_shares") ? Number(N("tiktok_avg_shares")) : null,
      N("instagram_followers") ? Number(N("instagram_followers")) : null,
      N("instagram_avg_views") ? Number(N("instagram_avg_views")) : null,
      N("instagram_avg_likes") ? Number(N("instagram_avg_likes")) : null,
      N("instagram_avg_comments") ? Number(N("instagram_avg_comments")) : null,
      N("instagram_avg_shares") ? Number(N("instagram_avg_shares")) : null,
      "seeded",
      // status (required, NOT NULL, defaults to 'seeded')
      dryRun ? null : batchId,
      // import_batch_id
      now,
      now
    ];
    const INSERT_BASE = `
      INSERT INTO directory_creators
      (id, public_code, platform, handle, handle_lower, tiktok_user_id, instagram_user_id, email,
       audience_country, followers_total, avg_weekly_posts, engagement_rate, avg_views, avg_likes, avg_comments, avg_shares,
       audience_category_1, audience_category_2, audience_category_3, audience_age_range, audience_sex, audience_location,
       last_active, tiktok_followers, tiktok_avg_views, tiktok_avg_likes, tiktok_avg_comments, tiktok_avg_shares,
       instagram_followers, instagram_avg_views, instagram_avg_likes, instagram_avg_comments, instagram_avg_shares,
       status, import_batch_id, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;
    const UPSERT_TT = INSERT_BASE + `
      ON CONFLICT(tiktok_user_id) DO UPDATE SET
        platform=excluded.platform, handle=excluded.handle, handle_lower=excluded.handle_lower, email=excluded.email,
        audience_country=excluded.audience_country, followers_total=excluded.followers_total,
        avg_weekly_posts=excluded.avg_weekly_posts, engagement_rate=excluded.engagement_rate,
        avg_views=excluded.avg_views, avg_likes=excluded.avg_likes, avg_comments=excluded.avg_comments, avg_shares=excluded.avg_shares,
        audience_category_1=excluded.audience_category_1, audience_category_2=excluded.audience_category_2, audience_category_3=excluded.audience_category_3,
        audience_age_range=excluded.audience_age_range, audience_sex=excluded.audience_sex, audience_location=excluded.audience_location,
        last_active=excluded.last_active,
        tiktok_followers=excluded.tiktok_followers, tiktok_avg_views=excluded.tiktok_avg_views, tiktok_avg_likes=excluded.tiktok_avg_likes, tiktok_avg_comments=excluded.tiktok_avg_comments, tiktok_avg_shares=excluded.tiktok_avg_shares,
        instagram_followers=excluded.instagram_followers, instagram_avg_views=excluded.instagram_avg_views, instagram_avg_likes=excluded.instagram_avg_likes, instagram_avg_comments=excluded.instagram_avg_comments, instagram_avg_shares=excluded.instagram_avg_shares,
        import_batch_id=${dryRun ? "directory_creators.import_batch_id" : "excluded.import_batch_id"},
        updated_at=excluded.updated_at
    `;
    const UPSERT_IG = INSERT_BASE + `
      ON CONFLICT(instagram_user_id) DO UPDATE SET
        platform=excluded.platform, handle=excluded.handle, handle_lower=excluded.handle_lower, email=excluded.email,
        audience_country=excluded.audience_country, followers_total=excluded.followers_total,
        avg_weekly_posts=excluded.avg_weekly_posts, engagement_rate=excluded.engagement_rate,
        avg_views=excluded.avg_views, avg_likes=excluded.avg_likes, avg_comments=excluded.avg_comments, avg_shares=excluded.avg_shares,
        audience_category_1=excluded.audience_category_1, audience_category_2=excluded.audience_category_2, audience_category_3=excluded.audience_category_3,
        audience_age_range=excluded.audience_age_range, audience_sex=excluded.audience_sex, audience_location=excluded.audience_location,
        last_active=excluded.last_active,
        tiktok_followers=excluded.tiktok_followers, tiktok_avg_views=excluded.tiktok_avg_views, tiktok_avg_likes=excluded.tiktok_avg_likes, tiktok_avg_comments=excluded.tiktok_avg_comments, tiktok_avg_shares=excluded.tiktok_avg_shares,
        instagram_followers=excluded.instagram_followers, instagram_avg_views=excluded.instagram_avg_views, instagram_avg_likes=excluded.instagram_avg_likes, instagram_avg_comments=excluded.instagram_avg_comments, instagram_avg_shares=excluded.instagram_avg_shares,
        import_batch_id=${dryRun ? "directory_creators.import_batch_id" : "excluded.import_batch_id"},
        updated_at=excluded.updated_at
    `;
    const UPSERT_HANDLE = INSERT_BASE + `
      ON CONFLICT(platform,handle_lower) DO UPDATE SET
        email=excluded.email, audience_country=excluded.audience_country, followers_total=excluded.followers_total,
        avg_weekly_posts=excluded.avg_weekly_posts, engagement_rate=excluded.engagement_rate,
        avg_views=excluded.avg_views, avg_likes=excluded.avg_likes, avg_comments=excluded.avg_comments, avg_shares=excluded.avg_shares,
        audience_category_1=excluded.audience_category_1, audience_category_2=excluded.audience_category_2, audience_category_3=excluded.audience_category_3,
        audience_age_range=excluded.audience_age_range, audience_sex=excluded.audience_sex, audience_location=excluded.audience_location,
        last_active=excluded.last_active,
        tiktok_followers=excluded.tiktok_followers, tiktok_avg_views=excluded.tiktok_avg_views, tiktok_avg_likes=excluded.tiktok_avg_likes, tiktok_avg_comments=excluded.tiktok_avg_comments, tiktok_avg_shares=excluded.tiktok_avg_shares,
        instagram_followers=excluded.instagram_followers, instagram_avg_views=excluded.instagram_avg_views, instagram_avg_likes=excluded.instagram_avg_likes, instagram_avg_comments=excluded.instagram_avg_comments, instagram_avg_shares=excluded.instagram_avg_shares,
        import_batch_id=${dryRun ? "directory_creators.import_batch_id" : "excluded.import_batch_id"},
        updated_at=excluded.updated_at
    `;
    try {
      if (!dryRun) {
        if (r["tiktok_user_id"]) await run(env.DB, UPSERT_TT, params);
        else if (r["instagram_user_id"]) await run(env.DB, UPSERT_IG, params);
        else await run(env.DB, UPSERT_HANDLE, params);
      }
      upserts++;
    } catch (e) {
      try {
        if (!dryRun) await run(env.DB, UPSERT_HANDLE, params);
        updates++;
      } catch (e2) {
        errors.push({ row: i + 1, error: e2.message || String(e2) });
      }
    }
  }
  return json({ dryRun, batch_id: dryRun ? null : batchId, upserts, updates, errors });
}
var EXPECT2;
var init_creators = __esm({
  "api/admin/chipchip/import/creators.js"() {
    init_functionsRoutes_0_7656062869946563();
    init_db();
    init_csv();
    EXPECT2 = [
      "handle",
      "tiktok_user_id",
      "instagram_user_id",
      "email",
      "audience_country",
      "followers_total",
      "avg_weekly_posts",
      "engagement_rate",
      "avg_views",
      "avg_likes",
      "avg_comments",
      "avg_shares",
      "audience_category_1",
      "audience_category_2",
      "audience_category_3",
      "audience_age_range",
      "audience_sex",
      "audience_location",
      "last_active",
      "tiktok_followers",
      "tiktok_avg_views",
      "tiktok_avg_likes",
      "tiktok_avg_comments",
      "tiktok_avg_shares",
      "instagram_followers",
      "instagram_avg_views",
      "instagram_avg_likes",
      "instagram_avg_comments",
      "instagram_avg_shares"
    ];
    __name(onRequest2, "onRequest");
  }
});

// api/admin/chipchip/audit/index.js
async function onRequest3({ env, request }) {
  const email = assertAdmin(env, request);
  if (!email) return notFound();
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "200", 10), 1e3);
  const rows = await q(env.DB, `SELECT * FROM admin_audit ORDER BY created_at DESC LIMIT ?`, [limit]);
  return json({ rows: rows.results });
}
var init_audit = __esm({
  "api/admin/chipchip/audit/index.js"() {
    init_functionsRoutes_0_7656062869946563();
    init_db();
    __name(onRequest3, "onRequest");
  }
});

// api/admin/chipchip/brands.js
function esc(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCSV(headers, rows) {
  const head = headers.join(",");
  const body = (rows.results ?? rows).map((r) => headers.map((h) => esc(r[h])).join(",")).join("\n");
  return head + "\n" + body + "\n";
}
async function onRequest4({ env, request }) {
  const email = assertAdmin(env, request);
  if (!email) return notFound();
  if (request.method !== "GET") return notFound();
  const url = new URL(request.url);
  const exportAll = url.searchParams.get("export") === "all";
  const q2 = (url.searchParams.get("q") || "").trim().toLowerCase();
  const limit = Math.min(Number(url.searchParams.get("limit") || 100), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);
  const where = [];
  const params = [];
  if (q2) {
    where.push("(brand_name_lower LIKE ? OR website_normalized LIKE ?)");
    params.push(`%${q2}%`, `%${q2}%`);
  }
  const WHERE = where.length ? `WHERE ${where.join(" AND ")}` : "";
  if (exportAll) {
    const headers = [
      "id",
      "brand_name",
      "website",
      "shortDesc",
      "category_1",
      "category_2",
      "category_3",
      "public_contact",
      "reviews_total",
      "rating_avg",
      "priceRange",
      "estimated_monthly",
      "customer_age_range",
      "customer_sex",
      "social_platform_1",
      "social_platform_2",
      "top_creator_videos_1",
      "top_creator_videos_2",
      "last_seen"
    ];
    const rows2 = await env.DB.prepare(`SELECT ${headers.join(",")}
                FROM directory_brands ${WHERE}
                ORDER BY brand_name_lower`).bind(...params).all();
    const csv = toCSV(headers, rows2);
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=brands_export.csv"
      }
    });
  }
  const total = await env.DB.prepare(`SELECT COUNT(1) AS c FROM directory_brands ${WHERE}`).bind(...params).first();
  const rows = await env.DB.prepare(`SELECT id,brand_name,website,priceRange,rating_avg,last_seen,public_code
              FROM directory_brands ${WHERE}
              ORDER BY brand_name_lower
              LIMIT ? OFFSET ?`).bind(...params, limit, offset).all();
  return json({ total: total?.c ?? 0, rows: rows.results ?? rows });
}
var init_brands2 = __esm({
  "api/admin/chipchip/brands.js"() {
    init_functionsRoutes_0_7656062869946563();
    init_db();
    __name(esc, "esc");
    __name(toCSV, "toCSV");
    __name(onRequest4, "onRequest");
  }
});

// api/admin/chipchip/brands.actions.js
async function parseJSON(req) {
  try {
    const copy = req.clone();
    return await copy.json();
  } catch {
    return {};
  }
}
async function onRequest5({ env, request }) {
  try {
    const email = assertAdmin(env, request);
    if (!email) return notFound();
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
    const body = await parseJSON(request);
    const action = String(body.action || "delete").toLowerCase();
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
    if (!ids.length) return json({ ok: false, error: "ids required" }, 400);
    if (!["delete", "hard_delete"].includes(action)) {
      return json({ ok: false, error: "action must be delete|hard_delete" }, 400);
    }
    const table = "directory_brands";
    const batchId = ulid();
    const ts = nowSec();
    const list = await getByIds(env.DB, table, ids);
    if (!list.length) return json({ ok: false, error: "no matching ids" }, 404);
    const qMarks = ids.map(() => "?").join(",");
    const stmts = [];
    if (action === "delete") {
      for (const r of list) {
        const before = JSON.stringify(r);
        stmts.push(
          env.DB.prepare(
            `INSERT INTO admin_recycle_bin (id, admin_email, action, entity_table, entity_id, before_json, after_json, batch_id, created_at, ts)
             VALUES (?,?,?,?,?,?,NULL,?,?,?)`
          ).bind(ulid(), email, action, table, r.id, before, batchId, ts, ts)
        );
      }
    }
    stmts.push(env.DB.prepare(`DELETE FROM ${table} WHERE id IN (${qMarks})`).bind(...ids));
    await env.DB.batch(stmts);
    return json({ ok: true, batch_id: batchId, deleted: list.length, action });
  } catch (e) {
    const msg = e && (e.stack || e.message) ? String(e.stack || e.message) : String(e);
    return json({ ok: false, error: msg }, 500);
  }
}
var init_brands_actions = __esm({
  "api/admin/chipchip/brands.actions.js"() {
    init_functionsRoutes_0_7656062869946563();
    init_db();
    __name(parseJSON, "parseJSON");
    __name(onRequest5, "onRequest");
  }
});

// api/admin/chipchip/creators.js
function esc2(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCSV2(headers, rows) {
  const head = headers.join(",");
  const arr = rows.results ?? rows;
  const body = arr.map((r) => headers.map((h) => esc2(r[h])).join(",")).join("\n");
  return head + "\n" + body + (arr.length ? "\n" : "");
}
async function onRequest6({ env, request }) {
  const email = assertAdmin(env, request);
  if (!email) return notFound();
  if (request.method !== "GET") return notFound();
  const url = new URL(request.url);
  const exportAll = url.searchParams.get("export") === "all";
  const q2 = (url.searchParams.get("q") || "").trim().toLowerCase();
  const limit = Math.min(Number(url.searchParams.get("limit") || 100), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);
  const where = [];
  const params = [];
  if (q2) {
    where.push("(handle_lower LIKE ? OR tiktok_user_id LIKE ? OR instagram_user_id LIKE ? OR email LIKE ?)");
    params.push(`%${q2}%`, `%${q2}%`, `%${q2}%`, `%${q2}%`);
  }
  const WHERE = where.length ? `WHERE ${where.join(" AND ")}` : "";
  if (exportAll) {
    const headers = [
      "id",
      "platform",
      "handle",
      "tiktok_user_id",
      "instagram_user_id",
      "email",
      "audience_country",
      "followers_total",
      "avg_weekly_posts",
      "engagement_rate",
      "avg_views",
      "avg_likes",
      "avg_comments",
      "avg_shares",
      "audience_category_1",
      "audience_category_2",
      "audience_category_3",
      "audience_age_range",
      "audience_sex",
      "audience_location",
      "last_active",
      "tiktok_followers",
      "tiktok_avg_views",
      "tiktok_avg_likes",
      "tiktok_avg_comments",
      "tiktok_avg_shares",
      "instagram_followers",
      "instagram_avg_views",
      "instagram_avg_likes",
      "instagram_avg_comments",
      "instagram_avg_shares"
    ];
    const rows2 = await env.DB.prepare(`SELECT ${headers.join(",")} FROM directory_creators ${WHERE} ORDER BY handle_lower`).bind(...params).all();
    const csv = toCSV2(headers, rows2);
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=creators_export.csv"
      }
    });
  }
  const total = await env.DB.prepare(`SELECT COUNT(1) AS c FROM directory_creators ${WHERE}`).bind(...params).first();
  const rows = await env.DB.prepare(
    `SELECT id,platform,handle,tiktok_user_id,instagram_user_id,followers_total,engagement_rate,last_active,public_code
     FROM directory_creators ${WHERE}
     ORDER BY handle_lower
     LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();
  return json({ total: total?.c ?? 0, rows: rows.results ?? rows });
}
var init_creators2 = __esm({
  "api/admin/chipchip/creators.js"() {
    init_functionsRoutes_0_7656062869946563();
    init_db();
    __name(esc2, "esc");
    __name(toCSV2, "toCSV");
    __name(onRequest6, "onRequest");
  }
});

// api/admin/chipchip/creators.actions.js
async function parseJSON2(req) {
  try {
    const copy = req.clone();
    return await copy.json();
  } catch {
    return {};
  }
}
async function onRequest7({ env, request }) {
  try {
    const email = assertAdmin(env, request);
    if (!email) return notFound();
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
    const body = await parseJSON2(request);
    const action = String(body.action || "delete").toLowerCase();
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
    if (!ids.length) return json({ ok: false, error: "ids required" }, 400);
    if (!["delete", "hard_delete"].includes(action)) {
      return json({ ok: false, error: "action must be delete|hard_delete" }, 400);
    }
    const table = "directory_creators";
    const batchId = ulid();
    const ts = nowSec();
    const list = await getByIds(env.DB, table, ids);
    if (!list.length) return json({ ok: false, error: "no matching ids" }, 404);
    const qMarks = ids.map(() => "?").join(",");
    const stmts = [];
    if (action === "delete") {
      for (const r of list) {
        const before = JSON.stringify(r);
        stmts.push(
          env.DB.prepare(
            `INSERT INTO admin_recycle_bin (id, admin_email, action, entity_table, entity_id, before_json, after_json, batch_id, created_at, ts)
             VALUES (?,?,?,?,?,?,NULL,?,?,?)`
          ).bind(ulid(), email, action, table, r.id, before, batchId, ts, ts)
        );
      }
    }
    stmts.push(env.DB.prepare(`DELETE FROM ${table} WHERE id IN (${qMarks})`).bind(...ids));
    await env.DB.batch(stmts);
    return json({ ok: true, batch_id: batchId, deleted: list.length, action });
  } catch (e) {
    const msg = e && (e.stack || e.message) ? String(e.stack || e.message) : String(e);
    return json({ ok: false, error: msg }, 500);
  }
}
var init_creators_actions = __esm({
  "api/admin/chipchip/creators.actions.js"() {
    init_functionsRoutes_0_7656062869946563();
    init_db();
    __name(parseJSON2, "parseJSON");
    __name(onRequest7, "onRequest");
  }
});

// api/admin/chipchip/undo.js
async function onRequest8({ env, request }) {
  const email = assertAdmin(env, request);
  if (!email) return notFound();
  if (request.method !== "POST") return notFound();
  const body = await request.json().catch(() => ({}));
  const batch_id = String(body.batch_id || "");
  if (!batch_id) return json({ ok: false, error: "batch_id required" }, 400);
  const delRows = await q(env.DB, `SELECT * FROM admin_recycle_bin WHERE batch_id=?`, [batch_id]);
  const rows = delRows.results || [];
  if (!rows.length) return json({ ok: false, error: "batch not found" }, 404);
  let restored = 0;
  for (const r of rows) {
    const obj = JSON.parse(r.before_json || "{}");
    const keys = Object.keys(obj);
    if (!keys.length) continue;
    const cols = keys.join(",");
    const placeholders = keys.map(() => "?").join(",");
    const vals = keys.map((k) => obj[k]);
    await run(env.DB, `INSERT OR IGNORE INTO ${r.entity_table} (${cols}) VALUES (${placeholders})`, vals);
    restored++;
  }
  await run(env.DB, `DELETE FROM admin_recycle_bin WHERE batch_id=?`, [batch_id]);
  return json({ ok: true, undone_batch: batch_id, restored });
}
var init_undo = __esm({
  "api/admin/chipchip/undo.js"() {
    init_functionsRoutes_0_7656062869946563();
    init_db();
    __name(onRequest8, "onRequest");
  }
});

// api/admin/chipchip/users/index.js
async function onRequest9({ env, request }) {
  const email = assertAdmin(env, request);
  if (!email) return notFound();
  const url = new URL(request.url);
  if (request.method === "GET") {
    const search = (url.searchParams.get("search") || "").toLowerCase();
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 500);
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);
    const sort = url.searchParams.get("sort") || "email";
    const dir = (url.searchParams.get("dir") || "asc").toUpperCase() === "DESC" ? "DESC" : "ASC";
    const exportAll = url.searchParams.get("export") === "all";
    const base = `SELECT u.id, u.email, u.username, u.full_name, u.role, u.phone,
              m.bestie_score, m.last_login_at, m.suspended_at,
              u.shop_name, u.is_shopify_store, u.tiktok_user_id, u.instagram_user_id
         FROM users u
         LEFT JOIN users_admin_meta m ON m.user_id = u.id`;
    const where = search ? ` WHERE LOWER(u.email) LIKE ? OR LOWER(u.username) LIKE ? OR LOWER(u.full_name) LIKE ?` : ``;
    const orderCol = ["email", "username", "full_name", "role", "last_login_at", "bestie_score"].includes(sort) ? sort === "last_login_at" ? "m.last_login_at" : sort === "bestie_score" ? "m.bestie_score" : `u.${sort}` : "u.email";
    const order = ` ORDER BY ${orderCol} ${dir}`;
    if (exportAll) {
      const rows2 = await q(env.DB, base + where + order, search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []);
      const header = ["id", "email", "username", "full_name", "role", "phone", "shop_name", "is_shopify_store", "tiktok_user_id", "instagram_user_id", "last_login_at", "bestie_score", "suspended_at"];
      const out = rows2.results.map((r) => header.map((h) => r[h]));
      return csvResponse("users_export.csv", header, out);
    }
    const count = await q(env.DB, `SELECT COUNT(1) as c FROM users u` + (where ? where : ""), search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []);
    const rows = await q(
      env.DB,
      base + where + order + ` LIMIT ? OFFSET ?`,
      search ? [`%${search}%`, `%${search}%`, `%${search}%`, limit, offset] : [limit, offset]
    );
    return json({ total: count.results[0]?.c || 0, rows: rows.results });
  }
  if (request.method === "POST") {
    const body = await request.json();
    const { action, ids = [] } = body || {};
    if (!Array.isArray(ids) || ids.length === 0) return json({ error: "ids required" }, 400);
    const ts = Math.floor(Date.now() / 1e3);
    const batch = crypto.randomUUID?.() || String(ts);
    if (action === "suspend" || action === "unsuspend") {
      for (const id of ids) {
        const before = await q(env.DB, `SELECT * FROM users_admin_meta WHERE user_id=?`, [id]);
        const now = ts;
        if (action === "suspend") {
          await run(env.DB, `INSERT INTO users_admin_meta(user_id, suspended_at) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET suspended_at=excluded.suspended_at`, [id, now]);
        } else {
          await run(env.DB, `INSERT INTO users_admin_meta(user_id, suspended_at) VALUES(?,NULL) ON CONFLICT(user_id) DO UPDATE SET suspended_at=NULL`, [id]);
        }
        await audit(env, email, action, "users_admin_meta", id, before.results?.[0] || null, { user_id: id, suspended_at: action === "suspend" ? now : null }, batch, ts);
      }
      return json({ ok: true, batch_id: batch, count: ids.length });
    }
    if (action === "delete") {
      for (const id of ids) {
        const row = await q(env.DB, `SELECT * FROM users WHERE id=?`, [id]);
        if (row.results?.length) {
          await run(
            env.DB,
            `INSERT INTO admin_recycle_bin(id, entity_table, entity_id, before_json, batch_id, created_at)
                                  VALUES(?,?,?,?,?,?)`,
            [crypto.randomUUID?.() || String(ts), "users", id, JSON.stringify(row.results[0]), batch, ts]
          );
          await run(env.DB, `DELETE FROM users WHERE id=?`, [id]);
          await audit(env, email, "delete", "users", id, row.results[0], null, batch, ts);
        }
      }
      return json({ ok: true, batch_id: batch, count: ids.length });
    }
    return json({ error: "unsupported action" }, 400);
  }
  return notFound();
}
async function audit(env, actor, action, table, id, before, after, batch, ts) {
  await (await Promise.resolve().then(() => (init_db(), db_exports))).run(
    env.DB,
    `INSERT INTO admin_audit(id, actor_email, action, entity_table, entity_id, before_json, after_json, batch_id, created_at)
     VALUES(?,?,?,?,?,?,?,?,?)`,
    [crypto.randomUUID?.() || String(ts), actor, action, table, id, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null, batch, ts]
  );
}
var init_users = __esm({
  "api/admin/chipchip/users/index.js"() {
    init_functionsRoutes_0_7656062869946563();
    init_db();
    __name(onRequest9, "onRequest");
    __name(audit, "audit");
  }
});

// api/account/address.js
function cookieEmail(req) {
  const c = req.headers.get("Cookie") || "";
  const m = c.split(";").map((s) => s.trim()).find((s) => s.startsWith("bestie_email="));
  return m ? decodeURIComponent(m.split("=").slice(1).join("=")) : "";
}
function pick(txt, name) {
  const m = txt.match(new RegExp(`<${name}>([^<]*)</${name}>`, "i"));
  return m ? m[1].trim() : "";
}
function json2(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
async function onRequestPost({ request, env }) {
  const email = cookieEmail(request);
  if (!email) return json2({ ok: false, error: "unauthorized" }, 401);
  const user = await env.DB.prepare("SELECT id, role FROM users WHERE email=?").bind(email).first();
  if (!user) return json2({ ok: false, error: "not_found" }, 404);
  if (user.role !== "creator") return json2({ ok: false, error: "not_creator" }, 400);
  const b = await request.json().catch(() => ({}));
  let street = String(b.street || "").trim();
  let apt = String(b.apt || "").trim();
  let city = String(b.city || "").trim();
  let state = String(b.state || "").trim().toUpperCase();
  let zip = String(b.zip || "").trim();
  if (!street || !city || !state || !/^\d{5}(-\d{4})?$/.test(zip)) return json2({ ok: false, error: "bad_address" }, 400);
  if (!env.USPS_USERID) return json2({ ok: false, error: "missing_usps_userid" }, 500);
  const zip5 = (zip.match(/^\d{5}/) || [""])[0];
  const xml = `<AddressValidateRequest USERID="${env.USPS_USERID}"><Revision>1</Revision><Address ID="0"><Address1>${apt}</Address1><Address2>${street}</Address2><City>${city}</City><State>${state}</State><Zip5>${zip5}</Zip5><Zip4></Zip4></Address></AddressValidateRequest>`;
  const url = `https://secure.shippingapis.com/ShippingAPI.dll?API=Verify&XML=${encodeURIComponent(xml)}`;
  const resp = await fetch(url);
  const txt = await resp.text();
  if (/<Error>/i.test(txt)) return json2({ ok: false, error: "usps_fail", desc: pick(txt, "Description") }, 400);
  const nStreet = pick(txt, "Address2");
  const nApt = pick(txt, "Address1");
  const nCity = pick(txt, "City");
  const nState = pick(txt, "State");
  const zip5n = pick(txt, "Zip5");
  const zip4n = pick(txt, "Zip4");
  const zip9 = zip4n ? `${zip5n}-${zip4n}` : zip5n;
  await env.DB.prepare(`
    INSERT INTO addresses (user_id,country,street,city,region,postal)
    VALUES (?,?,?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET
      country=excluded.country, street=excluded.street, city=excluded.city,
      region=excluded.region, postal=excluded.postal, updated_at=unixepoch();
  `).bind(user.id, "US", nStreet, nCity, nState, zip9).run();
  return json2({ ok: true });
}
var init_address = __esm({
  "api/account/address.js"() {
    init_functionsRoutes_0_7656062869946563();
    __name(cookieEmail, "cookieEmail");
    __name(pick, "pick");
    __name(json2, "json");
    __name(onRequestPost, "onRequestPost");
  }
});

// api/account/password.js
function cookieEmail2(req) {
  const c = req.headers.get("Cookie") || "";
  const m = c.split(";").map((s) => s.trim()).find((s) => s.startsWith("bestie_email="));
  return m ? decodeURIComponent(m.split("=").slice(1).join("=")) : "";
}
async function hashPw(pw, saltB) {
  const keyMat = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltB, iterations: 1e5 }, keyMat, 256);
  return new Uint8Array(bits);
}
async function onRequestPost2({ request, env }) {
  const email = cookieEmail2(request);
  if (!email) return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  const b = await request.json().catch(() => ({}));
  const curr = String(b.current || "");
  const next = String(b.password || "");
  if (!next || next.length < 8) return new Response(JSON.stringify({ ok: false, error: "bad_password" }), { status: 400, headers: { "Content-Type": "application/json" } });
  const u = await env.DB.prepare("SELECT id, pw_salt, pw_hash FROM users WHERE email=?").bind(email).first();
  if (!u) return new Response(JSON.stringify({ ok: false, error: "not_found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  if (u.pw_hash) {
    const saltB = b64toBytes(u.pw_salt || "");
    const calc = await hashPw(curr, saltB);
    if (b64(calc) !== (u.pw_hash || "")) {
      return new Response(JSON.stringify({ ok: false, error: "wrong_password" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await hashPw(next, salt);
  await env.DB.prepare("UPDATE users SET pw_salt=?, pw_hash=?, updated_at=unixepoch() WHERE id=?").bind(b64(salt), b64(hash), u.id).run();
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
}
var enc, b64, b64toBytes;
var init_password = __esm({
  "api/account/password.js"() {
    init_functionsRoutes_0_7656062869946563();
    __name(cookieEmail2, "cookieEmail");
    enc = new TextEncoder();
    b64 = /* @__PURE__ */ __name((a) => btoa(String.fromCharCode(...a)), "b64");
    b64toBytes = /* @__PURE__ */ __name((s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)), "b64toBytes");
    __name(hashPw, "hashPw");
    __name(onRequestPost2, "onRequestPost");
  }
});

// api/account/profile.js
function cookieEmail3(req) {
  const c = req.headers.get("Cookie") || "";
  const m = c.split(";").map((s) => s.trim()).find((s) => s.startsWith("bestie_email="));
  return m ? decodeURIComponent(m.split("=").slice(1).join("=")) : "";
}
async function onRequestPost3({ request, env }) {
  const email = cookieEmail3(request);
  if (!email) return new Response("unauthorized", { status: 401 });
  const b = await request.json().catch(() => ({}));
  const full = String(b.full_name || "").trim();
  const phone = String(b.phone || "").trim();
  if (!full) return new Response("bad_full_name", { status: 400 });
  const u = await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
  if (!u) return new Response("not_found", { status: 404 });
  await env.DB.prepare(`UPDATE users SET full_name=?, phone=?, updated_at=unixepoch() WHERE id=?`).bind(full, phone, u.id).run();
  return new Response(null, { status: 204 });
}
var init_profile = __esm({
  "api/account/profile.js"() {
    init_functionsRoutes_0_7656062869946563();
    __name(cookieEmail3, "cookieEmail");
    __name(onRequestPost3, "onRequestPost");
  }
});

// api/address/verify.js
async function getToken(env) {
  const now = Date.now();
  if (TOKEN_CACHE.token && TOKEN_CACHE.exp - now > 6e4) return TOKEN_CACHE.token;
  const oauthUrl = env.USPS_OAUTH_URL || "https://apis.usps.com/oauth2/v3/token";
  const body = JSON.stringify({
    grant_type: "client_credentials",
    client_id: env.USPS_CLIENT_ID,
    client_secret: env.USPS_CLIENT_SECRET
  });
  const r = await fetch(oauthUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body
  });
  if (!r.ok) throw new Error(`USPS OAuth ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const ttlMs = (j.expires_in ? Number(j.expires_in) : 8 * 3600) * 1e3;
  TOKEN_CACHE = { token: j.access_token, exp: Date.now() + ttlMs };
  return TOKEN_CACHE.token;
}
function json3(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
async function onRequestPost4({ request, env }) {
  try {
    const { street, apt = "", city, state, zip } = await request.json().catch(() => ({}));
    if (!street || !city || !state || !zip) {
      return json3({ ok: false, error: "missing_fields", fields: { street: !!street, city: !!city, state: !!state, zip: !!zip } }, 400);
    }
    const token = await getToken(env);
    const base = env.USPS_ADDR_URL || "https://apis.usps.com/addresses/v3/address";
    const u = new URL(base);
    u.searchParams.set("streetAddress", street);
    if (apt) u.searchParams.set("secondaryAddress", apt);
    u.searchParams.set("city", city);
    u.searchParams.set("state", state);
    u.searchParams.set("ZIPCode", zip);
    const r = await fetch(u.toString(), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
    });
    const text = await r.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
    }
    if (!r.ok) return json3({ ok: false, error: "usps_error", details: data || text }, r.status);
    const addr = data?.address || data?.addresses?.[0]?.address || null;
    const info = data?.additionalInfo || data?.addresses?.[0]?.additionalInfo || null;
    const normalized = {
      streetAddress: addr?.streetAddress ?? addr?.addressLine1 ?? null,
      secondaryAddress: addr?.secondaryAddress ?? addr?.addressLine2 ?? null,
      city: addr?.city ?? null,
      state: addr?.state ?? null,
      zip5: addr?.ZIPCode ?? addr?.zipCode ?? addr?.zip5 ?? null,
      zip4: addr?.ZIPPlus4 ?? addr?.zipPlus4 ?? addr?.plus4Code ?? null,
      dpvConfirmation: info?.DPVConfirmation ?? info?.dpvConfirmation ?? null,
      // Y/N/S/D
      carrierRoute: info?.carrierRoute ?? null,
      deliveryPoint: info?.deliveryPoint ?? null,
      business: info?.business ?? null,
      vacant: info?.vacant ?? null
    };
    return json3({ ok: true, normalized, raw: data }, 200);
  } catch (err) {
    return json3({ ok: false, error: "server_error", details: String(err?.message || err) }, 500);
  }
}
var TOKEN_CACHE;
var init_verify = __esm({
  "api/address/verify.js"() {
    init_functionsRoutes_0_7656062869946563();
    TOKEN_CACHE = { token: null, exp: 0 };
    __name(getToken, "getToken");
    __name(json3, "json");
    __name(onRequestPost4, "onRequestPost");
  }
});

// api/signup/complete.js
async function hashPassword(pw) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMat = await crypto.subtle.importKey("raw", enc2.encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 1e5 }, keyMat, 256);
  return { salt: b642(salt), hash: b642(new Uint8Array(bits)) };
}
async function onRequestPost5({ request, env }) {
  const b = await request.json().catch(() => ({}));
  const email = String(b.email || "").trim().toLowerCase();
  const username = String(b.username || "").trim();
  const usernameNorm = username.toLowerCase();
  const full_name = String(b.full_name || "").trim();
  const phone = String(b.phone || "").trim();
  const role = b.role === "creator" ? "creator" : "brand";
  const accepted = !!b.accepted_terms;
  const terms_version = String(b.terms_version || "v1");
  const password = String(b.password || "");
  const bad = /* @__PURE__ */ __name((code, status = 400) => new Response(JSON.stringify({ ok: false, error: code }), {
    status,
    headers: { "Content-Type": "application/json" }
  }), "bad");
  if (!email || !username || !full_name || !accepted) return bad("missing_fields");
  if (!/^[A-Za-z0-9_]{3,15}$/.test(username)) return bad("bad_username");
  if (password.length < 8 || password.length > 15) return bad("bad_password");
  const db = env.DB;
  const user = await db.prepare(
    "SELECT id, role FROM users WHERE email=?"
  ).bind(email).first();
  if (!user) return bad("not_started");
  if (user.role !== role) return bad("role_mismatch", 409);
  const existing = await db.prepare(
    "SELECT id FROM users WHERE LOWER(username)=? AND id<>?"
  ).bind(usernameNorm, user.id).first();
  if (existing) return bad("username_taken", 409);
  const { salt, hash } = await hashPassword(password);
  try {
    await db.prepare(`
      UPDATE users SET
        username=?,
        full_name=?,
        phone=?,
        terms_version=?,
        accepted_terms_at=unixepoch(),
        pw_salt=?,
        pw_hash=?,
        updated_at=unixepoch()
      WHERE id=?;
    `).bind(username, full_name, phone, terms_version, salt, hash, user.id).run();
  } catch (e) {
    const msg = e && e.message || "";
    if (msg.includes("UNIQUE") && msg.includes("users.username")) return bad("username_taken", 409);
    throw e;
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  });
}
var enc2, b642;
var init_complete = __esm({
  "api/signup/complete.js"() {
    init_functionsRoutes_0_7656062869946563();
    enc2 = new TextEncoder();
    b642 = /* @__PURE__ */ __name((a) => btoa(String.fromCharCode(...a)), "b64");
    __name(hashPassword, "hashPassword");
    __name(onRequestPost5, "onRequestPost");
  }
});

// api/users/me.js
function cookieEmail4(req) {
  const c = req.headers.get("Cookie") || "";
  const m = c.split(";").map((s) => s.trim()).find((s) => s.startsWith("bestie_email="));
  return m ? decodeURIComponent(m.split("=").slice(1).join("=")) : "";
}
async function onRequestGet({ request, env }) {
  const email = cookieEmail4(request);
  if (!email) return new Response(JSON.stringify({ ok: false }), { headers: { "Content-Type": "application/json" } });
  const u = await env.DB.prepare("SELECT id,email,username,full_name,role,phone FROM users WHERE email=?").bind(email).first();
  const a = u ? await env.DB.prepare("SELECT street,city,region AS state,postal AS zip FROM addresses WHERE user_id=?").bind(u.id).first() : null;
  return new Response(JSON.stringify({ ok: !!u, user: u || null, address: a || null }), { headers: { "Content-Type": "application/json" } });
}
var init_me = __esm({
  "api/users/me.js"() {
    init_functionsRoutes_0_7656062869946563();
    __name(cookieEmail4, "cookieEmail");
    __name(onRequestGet, "onRequestGet");
  }
});

// oauth/tiktok/callback.js
async function json4(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json" }
  });
}
async function onRequestGet2(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const err = url.searchParams.get("error");
    if (err) {
      return json4({
        ok: false,
        source: "tiktok",
        error: err,
        error_description: url.searchParams.get("error_description"),
        log_id: url.searchParams.get("log_id"),
        state: url.searchParams.get("state")
      }, 400);
    }
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) return json4({ ok: false, message: "Missing code/state" }, 400);
    const cookie = request.headers.get("cookie") || "";
    const match2 = cookie.match(/(?:^|;\s*)tik_state=([^;]+)/);
    if (!match2 || match2[1] !== state) return json4({ ok: false, message: "State mismatch" }, 400);
    const origin = url.origin;
    const redirectUri = env.TIKTOK_REDIRECT_URI && env.TIKTOK_REDIRECT_URI.trim() ? env.TIKTOK_REDIRECT_URI : `${origin}/oauth/tiktok/callback`;
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: env.TIKTOK_CLIENT_KEY || "",
        client_secret: env.TIKTOK_CLIENT_SECRET || "",
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri
      })
    });
    const tokenText = await tokenRes.text();
    let token;
    try {
      token = JSON.parse(tokenText);
    } catch {
      token = null;
    }
    if (!tokenRes.ok || !token || !token.access_token) {
      return json4({ ok: false, message: "Token exchange failed", status: tokenRes.status, body: tokenText }, 502);
    }
    const infoRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
      { headers: { Authorization: `Bearer ${token.access_token}` } }
    );
    const infoText = await infoRes.text();
    let info;
    try {
      info = JSON.parse(infoText);
    } catch {
      info = null;
    }
    const u = info?.data?.user || {};
    const open_id = u.open_id || "";
    const display_name = u.display_name || "TikTok user";
    const avatar = u.avatar_url || "";
    if (env.DB && open_id) {
      try {
        await env.DB.prepare(
          "INSERT OR REPLACE INTO creators (open_id, display_name, avatar, role, connected_at) VALUES (?, ?, ?, ?, ?)"
        ).bind(open_id, display_name, avatar, "creator", Date.now()).run();
      } catch {
      }
    }
    const dest = new URL("/creators/profile/", origin);
    if (open_id) dest.searchParams.set("id", open_id);
    const base = "Path=/; Domain=.bestiecollabs.com; Secure; SameSite=Lax";
    const headers = new Headers({ "content-type": "text/html; charset=utf-8" });
    headers.append("Set-Cookie", "tik_state=; Max-Age=0; " + base + "; HttpOnly");
    headers.append("Set-Cookie", "tik_ok=1; Max-Age=2592000; " + base);
    headers.append("Set-Cookie", "tik_name=" + encodeURIComponent(display_name) + "; Max-Age=2592000; " + base);
    headers.append("Set-Cookie", "tik_id=" + encodeURIComponent(open_id) + "; Max-Age=2592000; " + base);
    const html = "<!doctype html><meta charset='utf-8'><title>Redirecting</title><script>location.replace(" + JSON.stringify(dest.toString()) + ");<\/script><noscript><a href='" + dest.toString().replace(/'/g, "%27") + "'>Continue</a></noscript>";
    return new Response(html, { status: 200, headers });
  } catch (e) {
    return json4({ ok: false, message: "Worker error", detail: String(e) }, 500);
  }
}
var init_callback = __esm({
  "oauth/tiktok/callback.js"() {
    init_functionsRoutes_0_7656062869946563();
    __name(json4, "json");
    __name(onRequestGet2, "onRequestGet");
  }
});

// api/admin/ping.js
async function onRequest10({ env, request }) {
  const email = assertAdmin(env, request);
  if (!email) return notFound();
  try {
    const res = await q(env.DB, "SELECT 1 AS ok");
    return json({ ok: true, db: res.results });
  } catch (e) {
    return json({ ok: false, error: e.message });
  }
}
var init_ping = __esm({
  "api/admin/ping.js"() {
    init_functionsRoutes_0_7656062869946563();
    init_db();
    __name(onRequest10, "onRequest");
  }
});

// api/creator.js
async function onRequestGet3({ request, env }) {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return new Response(JSON.stringify({ ok: false, message: "missing id" }), { status: 400 });
  const r = await env.DB.prepare(
    "SELECT open_id, display_name, avatar, role, connected_at FROM creators WHERE open_id = ?"
  ).bind(id).first();
  if (!r) return new Response(JSON.stringify({ ok: false, message: "not found" }), { status: 404 });
  const data = {
    open_id: r.open_id,
    display_name: r.display_name,
    avatar: r.avatar,
    role: r.role,
    since: r.connected_at,
    tiktok_connected: !!r.open_id,
    instagram_connected: false,
    tiktok_followers: null,
    tiktok_avg_views: null,
    tiktok_engagement: null,
    instagram_followers: null,
    category: null,
    location: null
  };
  return new Response(JSON.stringify({ ok: true, creator: data }, null, 2), {
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}
var init_creator = __esm({
  "api/creator.js"() {
    init_functionsRoutes_0_7656062869946563();
    __name(onRequestGet3, "onRequestGet");
  }
});

// api/creators.js
async function onRequestGet4({ env }) {
  const { results } = await env.DB.prepare("SELECT open_id, display_name, avatar, connected_at FROM creators ORDER BY connected_at DESC LIMIT 200").all();
  const creators = (results || []).map((r) => ({
    open_id: r.open_id,
    display_name: r.display_name,
    avatar: r.avatar,
    since: r.connected_at,
    tiktok_connected: !!r.open_id,
    instagram_connected: false
    // scaffold until IG is built
  }));
  return new Response(JSON.stringify({ creators }, null, 2), {
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}
var init_creators3 = __esm({
  "api/creators.js"() {
    init_functionsRoutes_0_7656062869946563();
    __name(onRequestGet4, "onRequestGet");
  }
});

// api/verify.js
function needsApt(street) {
  return /\b(apt|unit|suite|ste|#)\b/i.test(street || "");
}
function toZip9(zip, seed) {
  const m9 = String(zip || "").replace(/\D/g, "");
  if (m9.length >= 9) return m9.slice(0, 5) + "-" + m9.slice(5, 9);
  let h = 5381;
  for (const ch of String(seed || "")) h = (h << 5) + h + ch.charCodeAt(0);
  const last4 = String(Math.abs(h) % 1e4).padStart(4, "0");
  return String(zip).slice(0, 5) + "-" + last4;
}
async function onRequestPost6({ request }) {
  const a = await request.json().catch(() => ({}));
  const street = String(a.street || "").trim();
  const apt = String(a.apt || "").trim();
  const city = String(a.city || "").trim();
  const state = String(a.state || "").trim().toUpperCase();
  const zipRaw = String(a.zip || "").trim();
  const issues = [];
  if (!street) issues.push("missing_street");
  if (!city) issues.push("missing_city");
  if (!state || !STATES.has(state)) issues.push("bad_state");
  if (!/^\d{5}(-?\d{4})?$/.test(zipRaw)) issues.push("bad_zip");
  if (needsApt(street) && !apt) issues.push("apt_required");
  const ok = issues.length === 0;
  const zip9 = ok ? toZip9(zipRaw, `${street}|${city}|${state}`) : null;
  return new Response(JSON.stringify({ ok, normalized: { street, apt, city, state, zip: zip9 || zipRaw }, zip9, issues }), {
    headers: { "Content-Type": "application/json" }
  });
}
var STATES;
var init_verify2 = __esm({
  "api/verify.js"() {
    init_functionsRoutes_0_7656062869946563();
    STATES = /* @__PURE__ */ new Set([
      "AL",
      "AK",
      "AZ",
      "AR",
      "CA",
      "CO",
      "CT",
      "DE",
      "FL",
      "GA",
      "HI",
      "ID",
      "IL",
      "IN",
      "IA",
      "KS",
      "KY",
      "LA",
      "ME",
      "MD",
      "MA",
      "MI",
      "MN",
      "MS",
      "MO",
      "MT",
      "NE",
      "NV",
      "NH",
      "NJ",
      "NM",
      "NY",
      "NC",
      "ND",
      "OH",
      "OK",
      "OR",
      "PA",
      "RI",
      "SC",
      "SD",
      "TN",
      "TX",
      "UT",
      "VT",
      "VA",
      "WA",
      "WV",
      "WI",
      "WY"
    ]);
    __name(needsApt, "needsApt");
    __name(toZip9, "toZip9");
    __name(onRequestPost6, "onRequestPost");
  }
});

// auth/login.js
async function hashPw2(pw, saltB) {
  const keyMat = await crypto.subtle.importKey("raw", enc3.encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltB, iterations: 1e5 }, keyMat, 256);
  return new Uint8Array(bits);
}
async function onRequestPost7({ request, env }) {
  const b = await request.json().catch(() => ({}));
  const email = String(b.email || "").trim().toLowerCase();
  const password = String(b.password || "");
  if (!email || !password) {
    return new Response(JSON.stringify({ ok: false, error: "missing_fields" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const u = await env.DB.prepare("SELECT id,email,role,pw_salt,pw_hash FROM users WHERE email=?").bind(email).first();
  if (!u || !u.pw_hash) {
    return new Response(JSON.stringify({ ok: false, error: "not_found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }
  const calc = await hashPw2(password, b64toBytes2(u.pw_salt));
  if (b643(calc) !== u.pw_hash) {
    return new Response(JSON.stringify({ ok: false, error: "wrong_password" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const maxAge = 60 * 60 * 24 * 30;
  return new Response(JSON.stringify({ ok: true, redirect: "/account/" }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `bestie_email=${encodeURIComponent(email)}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`
    }
  });
}
var enc3, b643, b64toBytes2;
var init_login = __esm({
  "auth/login.js"() {
    init_functionsRoutes_0_7656062869946563();
    enc3 = new TextEncoder();
    b643 = /* @__PURE__ */ __name((a) => btoa(String.fromCharCode(...a)), "b64");
    b64toBytes2 = /* @__PURE__ */ __name((s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)), "b64toBytes");
    __name(hashPw2, "hashPw");
    __name(onRequestPost7, "onRequestPost");
  }
});

// auth/start.js
async function onRequestPost8({ request, env }) {
  const db = env.DB;
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const role = body.role === "creator" ? "creator" : "brand";
  const bad = /* @__PURE__ */ __name((code, status = 400) => new Response(JSON.stringify({ ok: false, error: code }), {
    status,
    headers: { "Content-Type": "application/json" }
  }), "bad");
  if (!email) return bad("missing_email");
  const u = await db.prepare(
    "SELECT id, role, pw_hash, accepted_terms_at FROM users WHERE email=?"
  ).bind(email).first();
  if (u && u.pw_hash && u.accepted_terms_at) {
    return bad("already_registered", 409);
  }
  if (u) {
    await db.prepare(
      "UPDATE users SET role=?, updated_at=unixepoch() WHERE id=?"
    ).bind(role, u.id).run();
    return new Response(JSON.stringify({ ok: true, role }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  await db.prepare(`
    INSERT INTO users (email, role, created_at, updated_at)
    VALUES (?, ?, unixepoch(), unixepoch())
  `).bind(email, role).run();
  return new Response(JSON.stringify({ ok: true, role }), {
    headers: { "Content-Type": "application/json" }
  });
}
var init_start = __esm({
  "auth/start.js"() {
    init_functionsRoutes_0_7656062869946563();
    __name(onRequestPost8, "onRequestPost");
  }
});

// connect/instagram.js
async function onRequestGet5() {
  return new Response(JSON.stringify({
    ok: false,
    message: "Instagram connect is not enabled yet."
  }, null, 2), { status: 501, headers: { "content-type": "application/json" } });
}
var init_instagram = __esm({
  "connect/instagram.js"() {
    init_functionsRoutes_0_7656062869946563();
    __name(onRequestGet5, "onRequestGet");
  }
});

// connect/tiktok.js
async function onRequestGet6({ request, env }) {
  const url = new URL(request.url);
  const role = url.searchParams.get("role") || "creator";
  const state = `${crypto.randomUUID()}:${role}`;
  const redirectUri = env.TIKTOK_REDIRECT_URI || `${url.origin}/oauth/tiktok/callback`;
  const auth = new URL("https://www.tiktok.com/v2/auth/authorize/");
  auth.searchParams.set("client_key", env.TIKTOK_CLIENT_KEY);
  auth.searchParams.set("scope", "user.info.basic");
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: auth.toString(),
      "Set-Cookie": `tik_state=${state}; Path=/; Domain=.bestiecollabs.com; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
    }
  });
}
var init_tiktok = __esm({
  "connect/tiktok.js"() {
    init_functionsRoutes_0_7656062869946563();
    __name(onRequestGet6, "onRequestGet");
  }
});

// db/ping.js
async function onRequestGet7({ env }) {
  const r = await env.DB.prepare("SELECT count(*) AS c FROM creators").first();
  return new Response(
    JSON.stringify({ ok: true, count: r?.c ?? 0 }, null, 2),
    { headers: { "content-type": "application/json" } }
  );
}
var init_ping2 = __esm({
  "db/ping.js"() {
    init_functionsRoutes_0_7656062869946563();
    __name(onRequestGet7, "onRequestGet");
  }
});

// debug/auth.js
async function onRequestGet8({ request, env }) {
  const out = { ok: true, hasDB: false, tables: [], users_count: null, users_columns: [], user: null, notes: [] };
  try {
    await env.DB.prepare("select 1").first();
    out.hasDB = true;
  } catch (e) {
    out.ok = false;
    out.notes.push('DB binding "DB" missing or not reachable');
    return json5(out, 500);
  }
  const t = await env.DB.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
  out.tables = t.results?.map((r) => r.name) || [];
  const ucnt = await env.DB.prepare(`SELECT count(*) AS n FROM users`).first().catch(() => null);
  out.users_count = ucnt?.n ?? null;
  const cols = await env.DB.prepare(`PRAGMA table_info('users')`).all().catch(() => ({ results: [] }));
  out.users_columns = cols.results?.map((c) => ({ name: c.name, type: c.type })) || [];
  const email = new URL(request.url).searchParams.get("email") || "";
  if (email) {
    out.user = await env.DB.prepare(`SELECT id,email,role,username FROM users WHERE email=?`).bind(email.toLowerCase()).first().catch(() => null);
  }
  return json5(out, 200);
  function json5(body, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  }
  __name(json5, "json");
}
var init_auth = __esm({
  "debug/auth.js"() {
    init_functionsRoutes_0_7656062869946563();
    __name(onRequestGet8, "onRequestGet");
  }
});

// dev/init.js
async function tableExists(db, name) {
  const r = await db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").bind(name).first();
  return !!r;
}
async function ensureUsers(db) {
  const exists = await tableExists(db, "users");
  if (!exists) {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT lower(hex(randomblob(16))),
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE,
        full_name TEXT,
        role TEXT NOT NULL CHECK (role IN ('brand','creator')),
        phone TEXT,
        terms_version TEXT,
        accepted_terms_at INTEGER,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
        pw_salt TEXT,
        pw_hash TEXT
      );
    `).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);`).run();
    return { created: true, altered: false };
  }
  const cols = await db.prepare(`PRAGMA table_info('users')`).all();
  const names = new Set((cols.results || []).map((c) => c.name));
  let altered = false;
  if (!names.has("pw_salt")) {
    await db.prepare(`ALTER TABLE users ADD COLUMN pw_salt TEXT;`).run();
    altered = true;
  }
  if (!names.has("pw_hash")) {
    await db.prepare(`ALTER TABLE users ADD COLUMN pw_hash TEXT;`).run();
    altered = true;
  }
  return { created: false, altered };
}
async function ensureAddresses(db) {
  const exists = await tableExists(db, "addresses");
  if (!exists) {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS addresses (
        user_id TEXT PRIMARY KEY,
        country TEXT,
        street TEXT,
        city TEXT,
        region TEXT,
        postal TEXT,
        updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `).run();
    return { created: true };
  }
  return { created: false };
}
async function onRequestGet9({ env }) {
  const out = { ok: true, notes: [], users: {}, addresses: {}, tables: [] };
  try {
    await env.DB.prepare("select 1").first();
  } catch {
    return json5({ ok: false, error: 'DB binding "DB" missing or not reachable' }, 500);
  }
  out.users = await ensureUsers(env.DB);
  out.addresses = await ensureAddresses(env.DB);
  const t = await env.DB.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
  out.tables = t.results?.map((r) => r.name) || [];
  return json5(out, 200);
  function json5(body, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  }
  __name(json5, "json");
}
var init_init = __esm({
  "dev/init.js"() {
    init_functionsRoutes_0_7656062869946563();
    __name(tableExists, "tableExists");
    __name(ensureUsers, "ensureUsers");
    __name(ensureAddresses, "ensureAddresses");
    __name(onRequestGet9, "onRequestGet");
  }
});

// disconnect.js
async function onRequestGet10() {
  const base = "Path=/; Domain=.bestiecollabs.com; Secure; SameSite=Lax";
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/signup/creator",
      "Set-Cookie": [
        "tik_ok=; Max-Age=0; " + base,
        "tik_name=; Max-Age=0; " + base,
        "tik_id=; Max-Age=0; " + base,
        "tik_state=; Max-Age=0; " + base + "; HttpOnly"
      ]
    }
  });
}
var init_disconnect = __esm({
  "disconnect.js"() {
    init_functionsRoutes_0_7656062869946563();
    __name(onRequestGet10, "onRequestGet");
  }
});

// health.js
async function onRequestGet11() {
  return new Response('{"ok":true}', { headers: { "content-type": "application/json" } });
}
var init_health = __esm({
  "health.js"() {
    init_functionsRoutes_0_7656062869946563();
    __name(onRequestGet11, "onRequestGet");
  }
});

// logout.js
async function onRequestGet12() {
  return new Response(null, {
    status: 302,
    headers: {
      "Location": "/",
      "Set-Cookie": "bestie_email=; Path=/; Max-Age=0; SameSite=Lax; Secure"
    }
  });
}
var init_logout = __esm({
  "logout.js"() {
    init_functionsRoutes_0_7656062869946563();
    __name(onRequestGet12, "onRequestGet");
  }
});

// ../.wrangler/tmp/pages-kWT29E/functionsRoutes-0.7656062869946563.mjs
var routes;
var init_functionsRoutes_0_7656062869946563 = __esm({
  "../.wrangler/tmp/pages-kWT29E/functionsRoutes-0.7656062869946563.mjs"() {
    init_brands();
    init_creators();
    init_audit();
    init_brands2();
    init_brands_actions();
    init_creators2();
    init_creators_actions();
    init_undo();
    init_users();
    init_address();
    init_password();
    init_profile();
    init_verify();
    init_complete();
    init_me();
    init_callback();
    init_ping();
    init_creator();
    init_creators3();
    init_verify2();
    init_login();
    init_start();
    init_instagram();
    init_tiktok();
    init_ping2();
    init_auth();
    init_init();
    init_disconnect();
    init_health();
    init_logout();
    routes = [
      {
        routePath: "/api/admin/chipchip/import/brands",
        mountPath: "/api/admin/chipchip/import",
        method: "",
        middlewares: [],
        modules: [onRequest]
      },
      {
        routePath: "/api/admin/chipchip/import/creators",
        mountPath: "/api/admin/chipchip/import",
        method: "",
        middlewares: [],
        modules: [onRequest2]
      },
      {
        routePath: "/api/admin/chipchip/audit",
        mountPath: "/api/admin/chipchip/audit",
        method: "",
        middlewares: [],
        modules: [onRequest3]
      },
      {
        routePath: "/api/admin/chipchip/brands",
        mountPath: "/api/admin/chipchip",
        method: "",
        middlewares: [],
        modules: [onRequest4]
      },
      {
        routePath: "/api/admin/chipchip/brands.actions",
        mountPath: "/api/admin/chipchip",
        method: "",
        middlewares: [],
        modules: [onRequest5]
      },
      {
        routePath: "/api/admin/chipchip/creators",
        mountPath: "/api/admin/chipchip",
        method: "",
        middlewares: [],
        modules: [onRequest6]
      },
      {
        routePath: "/api/admin/chipchip/creators.actions",
        mountPath: "/api/admin/chipchip",
        method: "",
        middlewares: [],
        modules: [onRequest7]
      },
      {
        routePath: "/api/admin/chipchip/undo",
        mountPath: "/api/admin/chipchip",
        method: "",
        middlewares: [],
        modules: [onRequest8]
      },
      {
        routePath: "/api/admin/chipchip/users",
        mountPath: "/api/admin/chipchip/users",
        method: "",
        middlewares: [],
        modules: [onRequest9]
      },
      {
        routePath: "/api/account/address",
        mountPath: "/api/account",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost]
      },
      {
        routePath: "/api/account/password",
        mountPath: "/api/account",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost2]
      },
      {
        routePath: "/api/account/profile",
        mountPath: "/api/account",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost3]
      },
      {
        routePath: "/api/address/verify",
        mountPath: "/api/address",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost4]
      },
      {
        routePath: "/api/signup/complete",
        mountPath: "/api/signup",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost5]
      },
      {
        routePath: "/api/users/me",
        mountPath: "/api/users",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet]
      },
      {
        routePath: "/oauth/tiktok/callback",
        mountPath: "/oauth/tiktok",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet2]
      },
      {
        routePath: "/api/admin/ping",
        mountPath: "/api/admin",
        method: "",
        middlewares: [],
        modules: [onRequest10]
      },
      {
        routePath: "/api/creator",
        mountPath: "/api",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet3]
      },
      {
        routePath: "/api/creators",
        mountPath: "/api",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet4]
      },
      {
        routePath: "/api/verify",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost6]
      },
      {
        routePath: "/auth/login",
        mountPath: "/auth",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost7]
      },
      {
        routePath: "/auth/start",
        mountPath: "/auth",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost8]
      },
      {
        routePath: "/connect/instagram",
        mountPath: "/connect",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet5]
      },
      {
        routePath: "/connect/tiktok",
        mountPath: "/connect",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet6]
      },
      {
        routePath: "/db/ping",
        mountPath: "/db",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet7]
      },
      {
        routePath: "/debug/auth",
        mountPath: "/debug",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet8]
      },
      {
        routePath: "/dev/init",
        mountPath: "/dev",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet9]
      },
      {
        routePath: "/disconnect",
        mountPath: "/",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet10]
      },
      {
        routePath: "/health",
        mountPath: "/",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet11]
      },
      {
        routePath: "/logout",
        mountPath: "/",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet12]
      }
    ];
  }
});

// ../.wrangler/tmp/bundle-p92IYC/middleware-loader.entry.ts
init_functionsRoutes_0_7656062869946563();

// ../.wrangler/tmp/bundle-p92IYC/middleware-insertion-facade.js
init_functionsRoutes_0_7656062869946563();

// ../../../../Users/daoch/AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
init_functionsRoutes_0_7656062869946563();

// ../../../../Users/daoch/AppData/Roaming/npm/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
init_functionsRoutes_0_7656062869946563();
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../Users/daoch/AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../../../Users/daoch/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_functionsRoutes_0_7656062869946563();
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../Users/daoch/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_functionsRoutes_0_7656062869946563();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-p92IYC/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../../Users/daoch/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
init_functionsRoutes_0_7656062869946563();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-p92IYC/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.25960231019140934.mjs.map
