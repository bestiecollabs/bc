import { ensureAdminOrThrow, json } from "../_util_admin.js";
export async function onRequestGet(c) {
  const { request, env } = c;
  ensureAdminOrThrow(request, env);
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit")||"20",10), 100);
  const rows = await env.DB.prepare(
    `SELECT id,name,slug,status,deleted_at,updated_at
     FROM brands ORDER BY COALESCE(deleted_at,'~'), id DESC LIMIT ?`
  ).bind(limit).all();
  return json(200, { ok:true, items: rows.results||[] });
}
