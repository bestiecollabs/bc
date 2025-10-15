export const onRequestGet = async (context) => {
  const { request, env } = context;
  const db = env.DB || env.bestiedb;

  const url = new URL(request.url);
  const limit = clampInt(url.searchParams.get("limit"), 1, 100, 50);
  const offset = clampInt(url.searchParams.get("offset"), 0, 10_000, 0);
  const q = (url.searchParams.get("q") || "").trim();
  const category = (url.searchParams.get("category") || "").trim();

  const where = [];
  const binds = [];

  // Public constraints
  where.push("has_us_presence = 1");
  where.push("COALESCE(is_dropshipper,0) = 0");
  where.push("COALESCE(status,'draft') != 'archived'");

  if (q) {
    where.push("(LOWER(name) LIKE ? OR LOWER(description) LIKE ?)");
    const like = `%${q.toLowerCase()}%`;
    binds.push(like, like);
  }
  if (category) {
    where.push("LOWER(COALESCE(category_primary,'')) = ?");
    binds.push(category.toLowerCase());
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const rows = await db.prepare(
    `SELECT id, name, website_url, category_primary, description, logo_url,
            instagram_url, tiktok_url, status
       FROM brands
       ${whereSql}
       ORDER BY updated_at DESC, id DESC
       LIMIT ? OFFSET ?`
  ).bind(...binds, limit, offset).all();

  const totalRow = await db.prepare(
    `SELECT COUNT(*) AS c FROM brands ${whereSql}`
  ).bind(...binds).first();

  return json({
    ok: true,
    total: totalRow?.c ?? 0,
    limit,
    offset,
    items: rows?.results ?? []
  });
};

function clampInt(v, min, max, dflt){
  const n = parseInt(v, 10);
  if (Number.isFinite(n)) return Math.max(min, Math.min(max, n));
  return dflt;
}
function json(b, s=200){
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
