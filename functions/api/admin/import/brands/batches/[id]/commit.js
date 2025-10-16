export async function onRequestPost({ env, params, request }){
  const url = new URL(request.url);
  const action = (url.searchParams.get("action")||"live").toLowerCase(); // "live" | "draft"
  const batchId = parseInt(params.id,10);
  if(!batchId) return new Response(JSON.stringify({ ok:false, error:"invalid batch id"}), { status:400, headers:{ "Content-Type":"application/json"}});

  const db = env.DB;
  await db.exec("BEGIN");
  try{
    const rows = await db.prepare(`SELECT id, data_json FROM import_rows WHERE batch_id=? AND valid=1 ORDER BY row_num ASC`).bind(batchId).all();

    if(action==="draft"){
      const ins = await db.prepare(`INSERT INTO brand_drafts (source_row_id, data_json, issues_json, created_at) VALUES (?,?,?,?)`);
      const now = new Date().toISOString();
      for(const r of rows.results){
        await ins.bind(r.id, r.data_json, "[]", now).run();
      }
    }else{
      const up = await db.prepare(`
        INSERT INTO brands (name,slug,domain,website_url,category_primary,category_secondary,category_tertiary,
                            instagram_url,tiktok_url,logo_url,featured,description,is_public)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1)
        ON CONFLICT(slug) DO UPDATE SET
          name=excluded.name, domain=excluded.domain, website_url=excluded.website_url,
          category_primary=excluded.category_primary, category_secondary=excluded.category_secondary,
          category_tertiary=excluded.category_tertiary, instagram_url=excluded.instagram_url,
          tiktok_url=excluded.tiktok_url, logo_url=excluded.logo_url,
          featured=excluded.featured, description=excluded.description, is_public=1`);
      for(const r of rows.results){
        const jo = JSON.parse(r.data_json);
        jo.slug = (jo.name||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,12) || String(Date.now()).slice(-6);
        await up.bind(
          jo.name, jo.slug, jo.domain, jo.website_url,
          jo.category_primary, jo.category_secondary, jo.category_tertiary,
          jo.instagram_url, jo.tiktok_url, jo.logo_url, jo.featured||0, jo.description||""
        ).run();
      }
    }

    await db.prepare(`UPDATE import_batches SET status=? WHERE id=?`).bind(action==="draft"?"drafted":"published", batchId).run();
    await db.exec("COMMIT");
    return new Response(JSON.stringify({ ok:true }), { headers:{ "Content-Type":"application/json"}});
  }catch(e){
    await db.exec("ROLLBACK");
    return new Response(JSON.stringify({ ok:false, error:String(e)}), { status:500, headers:{ "Content-Type":"application/json"}});
  }
}

export async function onRequestOptions(){
  return new Response(null,{ status:204, headers:{
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Methods":"POST,OPTIONS",
    "Access-Control-Allow-Headers":"content-type"
  }});
}