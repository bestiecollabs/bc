import { ensureAdminOrThrow, json } from "../_util_admin.js";
export async function onRequestGet(c) {
  const { request, env } = c;
  ensureAdminOrThrow(request, env);
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit")||"50",10), 200);
  const rows = await env.DB.prepare(
    `SELECT id, entity_table, entity_id, created_at
       FROM admin_recycle_bin
       ORDER BY created_at DESC
       LIMIT ?`
  ).bind(limit).all();
  return json(200, { ok:true, items: rows.results||[] });
}
