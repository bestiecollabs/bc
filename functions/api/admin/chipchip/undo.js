import { assertAdmin, json, notFound, q, run } from "./_lib/db.js";

export async function onRequest({ env, request }) {
  const email = assertAdmin(env, request);
  if (!email) return notFound();
  if (request.method !== "POST") return notFound();

  const body = await request.json().catch(() => ({}));
  const batch_id = String(body.batch_id || "");
  if (!batch_id) return json({ ok:false, error: "batch_id required" }, 400);

  const delRows = await q(env.DB, `SELECT * FROM admin_recycle_bin WHERE batch_id=?`, [batch_id]);
  const rows = delRows.results || [];
  if (!rows.length) return json({ ok:false, error: "batch not found" }, 404);

  let restored = 0;
  for (const r of rows) {
    const obj = JSON.parse(r.before_json || "{}");
    const keys = Object.keys(obj);
    if (!keys.length) continue;
    const cols = keys.join(",");
    const placeholders = keys.map(() => "?").join(",");
    const vals = keys.map(k => obj[k]);
    // Insert back if missing
    await run(env.DB, `INSERT OR IGNORE INTO ${r.entity_table} (${cols}) VALUES (${placeholders})`, vals);
    restored++;
  }

  // Clear the recycle bin entries for this batch
  await run(env.DB, `DELETE FROM admin_recycle_bin WHERE batch_id=?`, [batch_id]);

  return json({ ok: true, undone_batch: batch_id, restored });
}