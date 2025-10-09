import { assertAdmin, json, q } from "./_lib/db.js";

export async function onRequest({ env, request }) {
  const email = assertAdmin(env, request);
  if (!email) return json({ ok: false }, 404);

  const url = new URL(request.url);
  const entity = url.searchParams.get("entity_table") || "";
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") || 20)));
  const offset = Math.max(0, Number(url.searchParams.get("offset") || 0));

  const where = [];
  const params = [];
  if (entity) {
    where.push("entity_table = ?");
    params.push(entity);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = await q(env.DB, `SELECT COUNT(*) AS n FROM admin_recycle_bin ${whereSql}`, params);
  const rows = await q(
    env.DB,
    `SELECT id, entity_table, entity_id, batch_id, created_at
     FROM admin_recycle_bin
     ${whereSql}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  return json({ total: total?.results?.[0]?.n || 0, rows: rows?.results || [] });
}
