export async function onRequestPost({ env, params, request }) {
  const body = await request.json().catch(()=>({}));
  const action = body.action;
  const ids = Array.isArray(body.row_ids) ? body.row_ids.map(Number).filter(Boolean) : [];
  if (!action || !ids.length) return new Response(JSON.stringify({ ok:false, error:"action and row_ids required" }), { status:400, headers:{ "Content-Type":"application/json"}});
  const batchId = Number(params.id);
  const db = env.DB;
  await db.exec("BEGIN");
  try {
    if (action === "live") {
      const rows = await db.prepare(`SELECT id, parsed_json FROM import_rows WHERE batch_id=? AND id IN (${ids.map(()=>'?').join(',')}) AND valid=1`).bind(batchId, ...ids).all();
      const up = await db.prepare(`
        INSERT INTO brands (name,slug,domain,website_url,category_primary,category_secondary,category_tertiary,instagram_url,tiktok_url,logo_url,featured,description,is_public)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1)
        ON CONFLICT(slug) DO UPDATE SET
          name=excluded.name,
          domain=excluded.domain,
          website_url=excluded.website_url,
          category_primary=excluded.category_primary,
          category_secondary=excluded.category_secondary,
          category_tertiary=excluded.category_tertiary,
          instagram_url=excluded.instagram_url,
          tiktok_url=excluded.tiktok_url,
          logo_url=excluded.logo_url,
          featured=excluded.featured,
          description=excluded.description,
          is_public=1
      `);
      for (const r of rows.results){
        const jo = JSON.parse(r.parsed_json);
        await up.bind(
          jo.name, jo.slug, jo.domain, jo.website_url, jo.category_primary, jo.category_secondary, jo.category_tertiary,
          jo.instagram_url, jo.tiktok_url, jo.logo_url, jo.featured||0, jo.description||""
        ).run();
      }
    } else if (action === "draft") {
      const rows = await db.prepare(`SELECT id, parsed_json, errors_json FROM import_rows WHERE batch_id=? AND id IN (${ids.map(()=>'?').join(',')})`).bind(batchId, ...ids).all();
      const ins = await db.prepare(`INSERT INTO brand_drafts (source_row_id, data_json, issues_json) VALUES (?,?,?)`);
      for (const r of rows.results){
        await ins.bind(r.id, r.parsed_json, r.errors_json).run();
      }
    } else {
      throw new Error("invalid action");
    }
    await db.prepare(`UPDATE import_batches SET status=? WHERE id=?`).bind("committed", batchId).run();
    await db.exec("COMMIT");
    return new Response(JSON.stringify({ ok:true }), { headers:{ "Content-Type":"application/json"}});
  } catch(e){
    await db.exec("ROLLBACK");
    return new Response(JSON.stringify({ ok:false, error:String(e)}), { status:500, headers:{ "Content-Type":"application/json"}});
  }
}
