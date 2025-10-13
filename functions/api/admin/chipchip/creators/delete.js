import { ensureAdminOrThrow, json, nowIso, uuid } from '../_util_admin.js';
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const adminEmail = ensureAdminOrThrow(request, env);
    const { open_id } = await request.json();
    if (!open_id) return json(400, { ok: false, error: 'open_id required' });
    const row = await env.DB.prepare('SELECT * FROM creators WHERE open_id = ? AND (deleted_at IS NULL)').bind(open_id).first();
    if (!row) return json(404, { ok: false, error: 'creator not found or already deleted' });
    const batchId = request.headers.get('x-batch-id') || uuid();
    await env.DB.batch([
      env.DB.prepare('UPDATE creators SET deleted_at = ? WHERE open_id = ?').bind(nowIso(), open_id),
      env.DB.prepare('INSERT INTO admin_recycle_bin (id, entity_table, entity_id, before_json, batch_id, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(), 'creators', String(open_id), JSON.stringify(row), batchId, Date.now()),
      env.DB.prepare('INSERT INTO admin_audit (actor_email, action, entity_table, entity_id, created_at) VALUES (?, ?, ?, ?, ?)').bind(adminEmail, 'delete', 'creators', String(open_id), Date.now())
    ]);
    return json(200, { ok: true, open_id, batch_id: batchId });
  } catch (err) { return json(err.status || 500, { ok: false, error: String(err.message || err) }); }
}
