/** POST /api/admin/brands/:id/undo -> restore by clearing deleted_at */
export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const { request, env, params } = ctx;
  if (request.headers.get("x-admin-email") !== "collabsbestie@gmail.com") {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
  }
  const id = Number((params as any)?.id ?? "");
  if (!Number.isFinite(id)) {
    return new Response(JSON.stringify({ error: "invalid_id" }), { status: 400, headers: { "content-type": "application/json" } });
  }
  try {
    const stmt = await env.DB.prepare(
      "UPDATE brands SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL"
    ).bind(id).run();
    return new Response(JSON.stringify({ ok: true, affected: stmt.meta.changes ?? 0, id }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "update_failed", detail: String(e?.message ?? e) }), { status: 500, headers: { "content-type": "application/json" } });
  }
};
