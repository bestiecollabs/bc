export async function onRequestGet({ env }) {
  try {
    const row = await env.DB.prepare("SELECT count(*) AS users_count FROM users;").first();
    return Response.json({ ok: true, users_count: row?.users_count ?? 0 });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
