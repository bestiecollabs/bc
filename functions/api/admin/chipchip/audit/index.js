import { assertAdmin, json, notFound, q } from "../_lib/db.js";

export async function onRequest({ env, request }) {
  const email = assertAdmin(env, request);
  if (!email) return notFound();
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "200", 10), 1000);
  const rows = await q(env.DB, `SELECT * FROM admin_audit ORDER BY created_at DESC LIMIT ?`, [limit]);
  return json({ rows: rows.results });
}
