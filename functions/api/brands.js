/**
 * GET /api/brands?category=&q=&featured=&page=&limit=
 * Returns published brands only.
 */
export const onRequestGet = async ({ request, env }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const category = (url.searchParams.get("category") || "").trim().toLowerCase();
  const featured = url.searchParams.get("featured");
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  const where = ["status='published'"];
  const binds = [];
  if (q) { where.push("(LOWER(name) LIKE ? OR LOWER(domain) LIKE ? OR LOWER(description) LIKE ?)"); binds.push(`%${q}%`,`%${q}%`,`%${q}%`); }
  if (category) { where.push("(LOWER(category_primary)=? OR LOWER(category_secondary)=? OR LOWER(category_tertiary)=?)"); binds.push(category,category,category); }
  if (featured === "1") where.push("featured=1");

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const items = await db.prepare(`
    SELECT id,name,slug,domain,website_url,category_primary,category_secondary,category_tertiary, instagram_url,tiktok_url,logo_url,featured,description
    FROM brands
    ${whereSql}
    ORDER BY featured DESC, name ASC
    LIMIT ? OFFSET ?
  `).bind(...binds, limit, offset).all();

  const total = await db.prepare(`SELECT COUNT(*) as c FROM brands ${whereSql}`).bind(...binds).first();

  return new Response(JSON.stringify({
    ok:true,
    page, limit, total: total?.c ?? 0,
    items: items?.results ?? []
  }), { headers:{ "content-type":"application/json" }});
};

