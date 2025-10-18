/**
 * GET /api/admin/brands?status=in_review|published|draft|archived&limit=&offset=
 * Response: { ok, total, limit, offset, items: [] }
 */
export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const limit  = clamp(url.searchParams.get("limit"), 1, 100, 50);
  const offset = clamp(url.searchParams.get("offset"), 0, 100000, 0);
  const status = String(url.searchParams.get("status") || "").trim().toLowerCase();

  // Ensure table exists
  const exists = await env.DB.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='brands'"
  ).first();
  if (!exists) return j({ ok: true, total: 0, limit, offset, items: [] });

  const where = ["deleted_at IS NULL"];
  const binds = [];

  // Allowed statuses
  const allowed = new Set(["in_review","published","draft","archived"]);
  if (status && allowed.has(status)) {
    where.push("LOWER(COALESCE(status,'draft')) = ?");
    binds.push(status);
  }

  const whereSql = "WHERE " + where.join(" AND ");

  const listSql = `
    SELECT id, name, slug, status, is_public, logo_url, website_url, updated_at
    FROM brands ${whereSql}
    ORDER BY updated_at DESC, id DESC
    LIMIT ? OFFSET ?
  `;

  const totalSql = `SELECT COUNT(*) AS c FROM brands ${whereSql}`;

  const items = await env.DB.prepare(listSql).bind(...binds, limit, offset).all()
    .then(r => (r?.results) || [])
    .catch(() => []);

  const total = await env.DB.prepare(totalSql).bind(...binds).first()
    .then(r => (r?.c ?? 0))
    .catch(() => 0);

  return j({ ok: true, total, limit, offset, items });
}

function clamp(v, min, max, dflt){
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : dflt;
}

function j(body, status=200){
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, PATCH, OPTIONS",
      "access-control-allow-headers": "content-type, x-admin-email"
    }
  });
}
