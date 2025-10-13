import { ensureAdminOrThrow, json } from '../_util_admin.js';
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const adminEmail = ensureAdminOrThrow(request, env);
    const { open_id } = await request.json();
    if (!open_id) return json(400, { ok: false, error: 'open_id required' });
    const row = await env.DB.prepare('SELECT * FROM creators WHERE open_id = ? AND deleted_at IS NOT NULL').bind(open_id).first();
    if (!row) return json(404, { ok: false, error: 'creator not found or not deleted' });
    await env.DB.batch([
      env.DB.prepare('UPDATE creators SET deleted_at = NULL WHERE open_id = ?').bind(open_id),
      env.DB.prepare('INSERT INTO admin_audit (actor_email, action, entity_table, entity_id, created_at) VALUES (?, ?, ?, ?, ?)').bind(adminEmail, 'undo', 'creators', String(open_id), Date.now())
    ]);
    return json(200, { ok: true, open_id });
  } catch (err) { return json(err.status || 500, { ok: false, error: String(err.message || err) }); }
}
