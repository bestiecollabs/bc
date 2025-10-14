export async function onRequestPost({ env, request }) {
  const body = await request.json().catch(()=>({}));
  const ids = Array.isArray(body.draft_ids) ? body.draft_ids.map(Number).filter(Boolean) : [];
  if (!ids.length) return new Response(JSON.stringify({ ok:false, error:"draft_ids required" }), { status:400, headers:{ "Content-Type":"application/json"}});
  const db = env.DB;
  await db.exec("BEGIN");
  try {
    const rows = await db.prepare(`SELECT id, data_json FROM brand_drafts WHERE id IN (${ids.map(()=>'?').join(',')})`).bind(...ids).all();
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
      const jo = JSON.parse(r.data_json);
      await up.bind(
        jo.name, jo.slug, jo.domain, jo.website_url, jo.category_primary, jo.category_secondary, jo.category_tertiary,
        jo.instagram_url, jo.tiktok_url, jo.logo_url, jo.featured||0, jo.description||""
      ).run();
    }
    await db.prepare(`DELETE FROM brand_drafts WHERE id IN (${ids.map(()=>'?').join(',')})`).bind(...ids).run();
    await db.exec("COMMIT");
    return new Response(JSON.stringify({ ok:true }), { headers:{ "Content-Type":"application/json"}});
  } catch(e){
    await db.exec("ROLLBACK");
    return new Response(JSON.stringify({ ok:false, error:String(e)}), { status:500, headers:{ "Content-Type":"application/json"}});
  }
}
