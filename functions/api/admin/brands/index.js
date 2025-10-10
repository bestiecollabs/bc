export const onRequest = async ({ request, env }) => {
  const admin = request.headers.get("x-admin-email");
  if (!admin) return json({ ok:false, error:"unauthorized" }, 401);
  if (request.method !== "GET") return json({ ok:false, error:"method_not_allowed" }, 405);

  const db = env.DB;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const status = (url.searchParams.get("status") || "all").toLowerCase();
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
  const offset = (page - 1) * limit;

  const where = [];
  const binds = [];
  if (status === "draft" || status === "published") { where.push("status=?"); binds.push(status); }
  if (q) { where.push("(LOWER(name) LIKE ? OR LOWER(domain) LIKE ? OR LOWER(description) LIKE ?)"); binds.push(`%${q}%`,`%${q}%`,`%${q}%`); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const items = await db.prepare(`
    SELECT id,name,slug,domain,website_url,category_primary,category_secondary,category_tertiary,
           instagram_url,tiktok_url,logo_url,featured,status,updated_at
    FROM brands
    ${whereSql}
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `).bind(...binds, limit, offset).all();

  const totalRow = await db.prepare(`SELECT COUNT(*) as c FROM brands ${whereSql}`).bind(...binds).first();

  return json({ ok:true, page, limit, total: totalRow?.c ?? 0, items: items?.results ?? [] });
};
function json(b,s=200){ return new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json'}}); }
