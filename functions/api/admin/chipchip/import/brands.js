import { assertAdmin, json, notFound, run, ulid, makePublicCode, normalizeWebsite, nowSec } from "../_lib/db.js";
import { readCSV } from "../_lib/csv.js";

const EXPECT = ["id","brand_name","website","shortDesc","category_1","category_2","category_3","public_contact","reviews_total","rating_avg","priceRange","estimated_monthly","customer_age_range","customer_sex","social_platform_1","social_platform_2","top_creator_videos_1","top_creator_videos_2","last_seen"];

export async function onRequest({ env, request }) {
  const email = assertAdmin(env, request);
  if (!email) return notFound();
  if (request.method !== "POST") return notFound();

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "true";

  const { headers, rows } = await readCSV(request);
  const miss = EXPECT.filter(h => !headers.includes(h));
  if (miss.length) return json({ error: "missing headers", missing: miss }, 400);

  const ts = nowSec();
  const batchId = ulid();
  if (!dryRun) {
    await run(env.DB, `INSERT INTO admin_batches(id, actor_email, action, meta_json, created_at) VALUES(?,?,?,?,?)`,
      [batchId, email, "import_brands", JSON.stringify({ count: rows.length }), ts]);
  }

  const errors = [];
  let inserted = 0, updated = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const name = (r["brand_name"] || "").trim();
    if (!name) { errors.push({ row:i+1, error: "brand_name required" }); continue; }

    const websiteNorm = normalizeWebsite((r["website"] || "").trim() || null);
    const brand_name_lower = name.toLowerCase();
    const id = (r["id"] || "").trim() || ulid();
    const public_code = makePublicCode("5");
    const N = k => {
      const v = (r[k] ?? "").trim();
      return v === "" || /^unknown$/i.test(v) ? null : v;
    };
    const params = [
      id, public_code, name, brand_name_lower,
      N("website"), websiteNorm, N("shortDesc"),
      N("category_1"), N("category_2"), N("category_3"),
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
      nowSec(), nowSec()
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
        errors.push({ row: i+1, error: e2.message || String(e2) });
      }
    }
  }

  return json({ dryRun, batch_id: dryRun ? null : batchId, inserted, updated, errors });
}
