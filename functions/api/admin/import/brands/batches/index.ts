/**
 * GET /api/admin/import/brands/batches
 * Query params: ?limit&offset
 * Returns: { data: [{id, status, created_at, source_uri}], page: { limit, offset, count } }
 */
export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const adminHeader = request.headers.get("x-admin-email");
  if (adminHeader !== "collabsbestie@gmail.com") {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
  }

  const limitParam = Number(url.searchParams.get("limit") ?? "50");
  const offsetParam = Number(url.searchParams.get("offset") ?? "0");
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(200, limitParam)) : 50;
  const offset = Number.isFinite(offsetParam) ? Math.max(0, offsetParam) : 0;

  const sql = `
    SELECT id, status, source_uri, created_at
    FROM import_batches
    ORDER BY datetime(created_at) DESC, id DESC
    LIMIT ? OFFSET ?;`;

  try {
    const rows = await env.DB.prepare(sql).bind(limit, offset).all();
    const countRow = await env.DB.prepare(`SELECT COUNT(1) as c FROM import_batches;`).first<{ c: number }>();
    const body = {
      data: (rows.results ?? []).map((r: any) => ({
        id: r.id,
        status: r.status,
        source_uri: r.source_uri,
        created_at: r.created_at
      })),
      page: { limit, offset, count: countRow?.c ?? 0 }
    };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "query_failed", detail: String(err?.message ?? err) }), { status: 500, headers: { "content-type": "application/json" } });
  }
};
