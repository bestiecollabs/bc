import { ensureAdminOrThrow, json } from '../_util_admin.js';
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const adminEmail = ensureAdminOrThrow(request, env);
    const { id } = await request.json();
    if (!id) return json(400, { ok: false, error: 'id required' });
    const row = await env.DB.prepare('SELECT * FROM brands WHERE id = ? AND deleted_at IS NOT NULL').bind(id).first();
    if (!row) return json(404, { ok: false, error: 'brand not found or not deleted' });
    await env.DB.batch([
      env.DB.prepare('UPDATE brands SET deleted_at = NULL, updated_at = ? WHERE id = ?').bind(new Date().toISOString(), id),
      env.DB.prepare('INSERT INTO admin_audit (actor_email, action, entity_table, entity_id, created_at) VALUES (?, ?, ?, ?, ?)').bind(adminEmail, 'undo', 'brands', String(id), Date.now())
    ]);
    return json(200, { ok: true, id });
  } catch (err) { return json(err.status || 500, { ok: false, error: String(err.message || err) }); }
}
