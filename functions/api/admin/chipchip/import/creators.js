import { assertAdmin, json, notFound, run, ulid, makePublicCode, nowSec } from "../_lib/db.js";
import { readCSV } from "../_lib/csv.js";

const EXPECT = [
  "handle","tiktok_user_id","instagram_user_id","email","audience_country","followers_total",
  "avg_weekly_posts","engagement_rate","avg_views","avg_likes","avg_comments","avg_shares",
  "audience_category_1","audience_category_2","audience_category_3","audience_age_range",
  "audience_sex","audience_location","last_active",
  "tiktok_followers","tiktok_avg_views","tiktok_avg_likes","tiktok_avg_comments","tiktok_avg_shares",
  "instagram_followers","instagram_avg_views","instagram_avg_likes","instagram_avg_comments","instagram_avg_shares"
];

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
    await run(env.DB, `INSERT INTO admin_batches(id, actor_email, action, meta_json, created_at)
                       VALUES(?,?,?,?,?)`,
      [batchId, email, "import_creators", JSON.stringify({ count: rows.length }), ts]);
  }

  const errors = [];
  let upserts = 0, updates = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const handle = (r["handle"] || "").trim();
    const handle_lower = handle ? handle.toLowerCase() : null;

    if (!handle_lower && !r["tiktok_user_id"] && !r["instagram_user_id"]) {
      errors.push({ row: i+1, error: "handle or platform id required" });
      continue;
    }

    const N = name => {
      const v = (r[name] ?? "").trim();
      return v === "" || /^unknown$/i.test(v) ? null : v;
    };

    const id = ulid();
    const public_code = makePublicCode("3");
    const platform = r["tiktok_user_id"] && r["instagram_user_id"] ? "mixed"
                    : r["tiktok_user_id"] ? "tiktok"
                    : r["instagram_user_id"] ? "instagram" : "unknown";
    const now = nowSec();

    const params = [
      id, public_code, platform, handle, handle_lower,
      N("tiktok_user_id"), N("instagram_user_id"), N("email"),
      N("audience_country"),
      N("followers_total") ? Number(N("followers_total")) : null,
      N("avg_weekly_posts") ? Number(N("avg_weekly_posts")) : null,
      N("engagement_rate") ? Number(N("engagement_rate")) : null,
      N("avg_views") ? Number(N("avg_views")) : null,
      N("avg_likes") ? Number(N("avg_likes")) : null,
      N("avg_comments") ? Number(N("avg_comments")) : null,
      N("avg_shares") ? Number(N("avg_shares")) : null,
      N("audience_category_1"), N("audience_category_2"), N("audience_category_3"),
      N("audience_age_range"), N("audience_sex"), N("audience_location"),
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
      "seeded",                               // status (required, NOT NULL, defaults to 'seeded')
      dryRun ? null : batchId,               // import_batch_id
      now, now
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
        if (r["tiktok_user_id"])         await run(env.DB, UPSERT_TT, params);
        else if (r["instagram_user_id"]) await run(env.DB, UPSERT_IG, params);
        else                              await run(env.DB, UPSERT_HANDLE, params);
      }
      upserts++;
    } catch (e) {
      try {
        if (!dryRun) await run(env.DB, UPSERT_HANDLE, params);
        updates++;
      } catch (e2) {
        errors.push({ row: i+1, error: e2.message || String(e2) });
      }
    }
  }

  return json({ dryRun, batch_id: dryRun ? null : batchId, upserts, updates, errors });
}
