export const config = { runtime: "edge" };

/**
 * POST /api/admin/import/brands/batches/:id/commit
 * Inserts rows from import_rows for the batch into brands.
 * Admin-gated. Slug derived from brand_name. Draft status on insert.
 */
function forbidden(msg) {
  return new Response(JSON.stringify({ ok: false, error: msg }), { status: 403, headers: { "content-type": "application/json" } });
}
function bad(msg) {
  return new Response(JSON.stringify({ ok: false, error: msg }), { status: 400, headers: { "content-type": "application/json" } });
}
function slugify(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

export async function onRequestPost(ctx) {
  const admin = ctx.request.headers.get("x-admin-email") || "";
  if (admin.toLowerCase() !== "collabsbestie@gmail.com") return forbidden("admin header required");

  const url = new URL(ctx.request.url);
  const parts = url.pathname.split("/");
  const id = parts[parts.indexOf("batches") + 1];
  if (!id) return bad("missing batch id");

  const qRows = await ctx.env.DB.prepare(`
    SELECT id, batch_id, status, brand_name, website_url
    FROM import_rows
    WHERE batch_id = ?1
      AND (status = 'valid' OR status IS NULL)
    ORDER BY id ASC
  `).bind(id).all();

  const rows = qRows.results || [];
  if (rows.length === 0) {
    const anyRows = await ctx.env.DB.prepare(`SELECT id FROM import_rows WHERE batch_id = ?1 LIMIT 1`).bind(id).all();
    if ((anyRows.results || []).length === 0) return bad("no import_rows found for batch");
  }

  let inserted = 0, updated = 0, skipped = 0;

  for (const r of rows) {
    const name = (r.brand_name || "").trim();
    if (!name) { skipped++; continue; }
    const slug = slugify(name);

    const existing = await ctx.env.DB.prepare(
      `SELECT id FROM brands WHERE slug = ?1 AND deleted_at IS NULL`
    ).bind(slug).all();

    if ((existing.results || []).length > 0) {
      const u = await ctx.env.DB.prepare(`
        UPDATE brands
        SET name = COALESCE(?1, name),
            import_batch_id = COALESCE(?2, import_batch_id)
        WHERE slug = ?3 AND deleted_at IS NULL
      `).bind(name, "brands_" + id, slug).run();
      if ((u.meta?.changes || 0) > 0) updated++;
      continue;
    }

    const ins = await ctx.env.DB.prepare(`
      INSERT INTO brands (status, import_batch_id, name, slug, created_at)
      VALUES (?1, ?2, ?3, ?4, datetime('now'))
    `).bind("draft", "brands_" + id, name, slug).run();
    if ((ins.meta?.changes || 0) > 0) inserted++;
  }

  if (inserted + updated > 0) {
    await ctx.env.DB.prepare(`UPDATE import_batches SET status = 'committed' WHERE id = ?1`).bind(id).run();
  }

  return new Response(JSON.stringify({
    ok: true, id: String(id), inserted, updated, skipped, committed: inserted + updated > 0
  }), { headers: { "content-type": "application/json" } });
}