export const onRequestGet = async ({ env, request }) => {
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "50", 10)));

  // Ensure table exists
  const exists = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='brands'").first();
  if (!exists) {
    return new Response(JSON.stringify({ ok: true, rows: [] }), { headers: { "Content-Type": "application/json" }});
  }

  // Read from brands only. Ignore status. Exclude soft-deleted via deleted_at IS NULL.
  const rs = await env.DB
    .prepare("SELECT id, name, slug, status, deleted_at FROM brands WHERE deleted_at IS NULL ORDER BY id DESC LIMIT ?")
    .bind(limit)
    .all()
    .catch(() => ({ results: [] }));

  const rows = (rs.results || []).map(r => ({
    id: r.id ?? null,
    name: r.name ?? "",
    slug: r.slug ?? "",
    status: r.status ?? "draft",
    deleted: !!(r.deleted_at)
  }));

  return new Response(JSON.stringify({ ok: true, rows }), { headers: { "Content-Type": "application/json" }});
};
