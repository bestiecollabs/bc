/**
 * GET /api/admin/import/brands/batches/:id/rows
 * Query params: ?limit&offset
 * Returns: { data: [{id, row_num, valid, parsed}], page: { limit, offset, count } }
 */
export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const { request, env, params } = ctx;
  const url = new URL(request.url);
  const adminHeader = request.headers.get("x-admin-email");
  if (adminHeader !== "collabsbestie@gmail.com") {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
  }

  const batchId = String((params as any)?.id ?? "").trim();
  if (!batchId) {
    return new Response(JSON.stringify({ error: "missing_batch_id" }), { status: 400, headers: { "content-type": "application/json" } });
  }

  const limitParam = Number(url.searchParams.get("limit") ?? "100");
  const offsetParam = Number(url.searchParams.get("offset") ?? "0");
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(200, limitParam)) : 100;
  const offset = Number.isFinite(offsetParam) ? Math.max(0, offsetParam) : 0;

  const sql = `
    SELECT id, row_num, valid, parsed_json
    FROM import_rows
    WHERE batch_id = ?
    ORDER BY row_num ASC
    LIMIT ? OFFSET ?;`;

  try {
    const rows = await env.DB.prepare(sql).bind(batchId, limit, offset).all();
    const countRow = await env.DB.prepare(`SELECT COUNT(1) as c FROM import_rows WHERE batch_id = ?;`).bind(batchId).first<{ c: number }>();

    const data = (rows.results ?? []).map((r: any) => {
      let parsed: any = null;
      if (r.parsed_json) {
        try { parsed = JSON.parse(r.parsed_json); } catch { parsed = null; }
      }
      let minimal: any = {};
      if (parsed && typeof parsed === "object") {
        const pick = (k: string) => parsed[k] ?? parsed[k.toLowerCase()] ?? parsed[k.replace(/\s+/g, "_").toLowerCase()];
        minimal = {
          name: pick("name"),
          website_url: pick("website_url") ?? pick("website"),
          instagram: pick("instagram"),
          tiktok: pick("tiktok"),
          slug: pick("slug"),
          category: pick("category"),
          contact_email: pick("contact_email") ?? pick("email")
        };
      }
      return { id: r.id, row_num: r.row_num, valid: r.valid === 1 || r.valid === true, parsed: minimal };
    });

    const body = { data, page: { limit, offset, count: countRow?.c ?? 0 } };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "query_failed", detail: String(err?.message ?? err) }), { status: 500, headers: { "content-type": "application/json" } });
  }
};
