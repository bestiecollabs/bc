/**
 * GET /api/admin/brands
 * Query params:
 *   scope=all        -> include deleted and non-deleted (default: active only)
 *   status=draft     -> filter by status (lowercased compare)
 *   deleted=1        -> only deleted rows
 *   limit, offset    -> pagination
 */
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const scope   = (url.searchParams.get("scope") || "active").toLowerCase();
  const statusQ = (url.searchParams.get("status") || "").toLowerCase();
  const onlyDel = (url.searchParams.get("deleted") || "") === "1";
  const limit   = Math.max(0, Math.min(500, Number(url.searchParams.get("limit") || "200")));
  const offset  = Math.max(0, Number(url.searchParams.get("offset") || "0"));

  const where = [];
  const binds = [];

  if (onlyDel) {
    where.push("deleted_at IS NOT NULL");
  } else if (scope !== "all") {
    where.push("deleted_at IS NULL");
  }
  if (statusQ) {
    where.push("LOWER(status) = ?");
    binds.push(statusQ);
  }

  const sql = `
    SELECT id, name, slug, status, deleted_at
    FROM brands
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY id DESC
    LIMIT ? OFFSET ?`;
  const stmt = env.DB.prepare(sql).bind(...binds, limit, offset);
  const rows = await stmt.all().then(r => r.results || r);

  return json({ items: rows, limit, offset });
}

function json(b, s=200){
  return new Response(JSON.stringify(b), { status:s, headers:{ "content-type":"application/json" }});
}