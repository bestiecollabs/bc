export const config = { runtime: "edge" };

/**
 * GET /api/admin/brands
 * Query params: ?limit=number (default 50)
 * Reads active brands from the D1 `brands` table where deleted_at IS NULL.
 */
export async function onRequestGet(ctx) {
  const admin = ctx.request.headers.get("x-admin-email") || "";
  if (admin.toLowerCase() !== "collabsbestie@gmail.com") {
    return new Response(JSON.stringify({ ok: false, error: "admin header required" }), { status: 403, headers: { "content-type": "application/json" } });
  }

  const url = new URL(ctx.request.url);
  const limit = Math.max(1, Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200));

  const sql = `
    SELECT id, status, import_batch_id, name, slug, created_at
    FROM brands
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT ?1
  `;
  const res = await ctx.env.DB.prepare(sql).bind(limit).all();
  return new Response(JSON.stringify({ ok: true, rows: res.results || [] }), { headers: { "content-type": "application/json" } });
}
