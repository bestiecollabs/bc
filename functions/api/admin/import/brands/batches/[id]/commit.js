export const config = { runtime: "edge" };

function json(o, s = 200) { return new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } }); }
function forbid(m) { return json({ ok: false, error: m }, 403); }
function bad(m) { return json({ ok: false, error: m }, 400); }
function slugify(s) { return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-"); }

export async function onRequestPost(ctx) {
  const admin = ctx.request.headers.get("x-admin-email") || "";
  if (admin.toLowerCase() !== "collabsbestie@gmail.com") return forbid("admin header required");

  const parts = new URL(ctx.request.url).pathname.split("/");
  const id = parts[parts.indexOf("batches") + 1];
  if (!id) return bad("missing batch id");

  const q = await ctx.env.DB.prepare(`
    SELECT row_num, parsed_json
    FROM import_rows
    WHERE batch_id = ?1 AND valid = 1
    ORDER BY row_num ASC
  `).bind(id).all();

  const rows = q.results || [];
  if (rows.length === 0) return json({ ok: true, id: String(id), inserted: 0, updated: 0, skipped: 0, committed: false });

  let inserted = 0, updated = 0, skipped = 0;

  for (const r of rows) {
    try {
      let obj; try { obj = JSON.parse(r.parsed_json || "{}"); } catch { obj = {}; }

      const name = String(obj.name || obj.brand_name || "").trim();
      if (!name) { skipped++; continue; }

      const slug = String(obj.slug || slugify(name));
      const website_url = String(obj.website_url || "").trim();
      const category_primary   = (obj.category_primary   ?? "").toString().trim() || "General";
      const category_secondary = (obj.category_secondary ?? null);
      const category_tertiary  = (obj.category_tertiary  ?? null);
      const instagram_url      = (obj.instagram_url      ?? null);
      const tiktok_url         = (obj.tiktok_url         ?? null);
      const description        = (obj.description        ?? null);
      const customer_age_min   = Number.isFinite(Number(obj.customer_age_min)) ? Number(obj.customer_age_min) : 0;
      const customer_age_max   = Number.isFinite(Number(obj.customer_age_max)) ? Number(obj.customer_age_max) : 0;
      const us_based           = String(obj.us_based ?? "0").trim() === "1" ? 1 : 0;

      // Insert first; ignore if row already exists
      const ins = await ctx.env.DB.prepare(`
        INSERT OR IGNORE INTO brands (
          name, slug, website_url,
          category_primary, category_secondary, category_tertiary,
          instagram_url, tiktok_url, description,
          customer_age_min, customer_age_max, us_based,
          status, created_at, updated_at
        ) VALUES (
          ?1, ?2, ?3,
          ?4, ?5, ?6,
          ?7, ?8, ?9,
          ?10, ?11, ?12,
          'in_review', datetime('now'), datetime('now')
        )
      `).bind(
        name, slug, website_url,
        category_primary, category_secondary, category_tertiary,
        instagram_url, tiktok_url, description,
        customer_age_min, customer_age_max, us_based
      ).run();

      if ((ins.meta?.changes || 0) > 0) { inserted++; continue; }

      // Update existing by slug and restore soft-deletes
      const up = await ctx.env.DB.prepare(`
        UPDATE brands
           SET name = COALESCE(?1, name),
               website_url = COALESCE(?2, website_url),
               category_primary = COALESCE(?3, category_primary),
               category_secondary = COALESCE(?4, category_secondary),
               category_tertiary = COALESCE(?5, category_tertiary),
               instagram_url = COALESCE(?6, instagram_url),
               tiktok_url = COALESCE(?7, tiktok_url),
               description = COALESCE(?8, description),
               customer_age_min = COALESCE(?9, customer_age_min),
               customer_age_max = COALESCE(?10, customer_age_max),
               us_based = COALESCE(?11, us_based),
               status = COALESCE(status, 'in_review'),
               deleted_at = NULL,
               updated_at = datetime('now')
         WHERE slug = ?12
      `).bind(
        name || null,
        website_url || null,
        category_primary || null,
        category_secondary,
        category_tertiary,
        instagram_url,
        tiktok_url,
        description,
        customer_age_min,
        customer_age_max,
        us_based,
        slug
      ).run();

      if ((up.meta?.changes || 0) > 0) updated++; else skipped++;
    } catch { skipped++; }
  }

  if (inserted + updated > 0) {
    await ctx.env.DB.prepare(`UPDATE import_batches SET status='committed' WHERE id=?1`).bind(id).run();
  }

  return json({ ok: true, id: String(id), inserted, updated, skipped, committed: (inserted + updated) > 0 });
}