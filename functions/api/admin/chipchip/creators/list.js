import { ensureAdminOrThrow, json } from "../_util_admin.js";
export async function onRequestGet(c) {
  const { request, env } = c;
  ensureAdminOrThrow(request, env);
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit")||"20",10), 100);
  const rows = await env.DB.prepare(
    `SELECT open_id,display_name,role,deleted_at
     FROM creators ORDER BY COALESCE(deleted_at,'~'), rowid DESC LIMIT ?`
  ).bind(limit).all();
  return json(200, { ok:true, items: rows.results||[] });
}
