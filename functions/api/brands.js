export async function onRequestGet({ request, env }) {
  const db = env.DB;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const slug = (url.searchParams.get("slug") || "").trim();
  const category = (url.searchParams.get("category") || "").trim();
  const featured = url.searchParams.get("featured") === "1" ? 1 : null;
  const adminBypass = url.searchParams.get("admin") === "1";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "20", 10)));
  const offset = (page-1) * limit;

  const where = [];
  const params = [];
  if (!adminBypass) { where.push("is_public = 1"); }
  if (slug) { where.push("slug = ?"); params.push(slug); }
  if (q) {
    where.push("(name LIKE ? OR slug LIKE ? OR domain LIKE ?)");
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (category) {
    where.push("(category_primary = ? OR category_secondary = ? OR category_tertiary = ?)");
    params.push(category, category, category);
  }
  if (featured !== null) { where.push("featured = 1"); }

  const whereSql = where.length ? ("WHERE " + where.join(" AND ")) : "";
  const totalStmt = await db.prepare(`SELECT COUNT(*) as c FROM brands ${whereSql}`).bind(...params).first();
  const rows = await db.prepare(`
    SELECT id,name,slug,domain,website_url,category_primary,category_secondary,category_tertiary,
           instagram_url,tiktok_url,logo_url,featured,description
    FROM brands ${whereSql}
    ORDER BY name ASC
    LIMIT ? OFFSET ?
  `).bind(...params, limit, offset).all();

  return new Response(JSON.stringify({
    ok:true, page, limit, total: totalStmt.c, items: rows.results
  }), { headers:{ "Content-Type":"application/json"}});
}
