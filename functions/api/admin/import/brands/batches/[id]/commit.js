/**
 * functions/api/admin/import/brands/batches/[id]/commit.js
 * POST JSON: { action: "live"|"draft", row_ids: number[], admin?:1, publish_non_us?:1 }
 */
function extractDomain(url){
  try{ const u=new URL(String(url||"").trim()); let d=u.hostname.toLowerCase(); if(d.startsWith("www.")) d=d.slice(4); return d; }catch(_){ return ""; }
}
function toInt(x, def=0){ const n=Number.parseInt(String(x??"").trim(),10); return Number.isFinite(n)?n:def; }
async function genSlug6(db){
  for(let i=0;i<8;i++){ const s=String(Math.floor(100000+Math.random()*900000)); const hit=await db.prepare("SELECT 1 FROM brands WHERE slug=? LIMIT 1").bind(s).first(); if(!hit) return s; }
  return String(Date.now()).slice(-6);
}
export async function onRequestPost({ env, params, request }){
  const ct=(request.headers.get("content-type")||"").toLowerCase();
  if(!ct.includes("application/json")) {
    return new Response(JSON.stringify({ok:false,error:"content-type must be application/json"}),{status:400,headers:{"Content-Type":"application/json"}});
  }
  const body=await request.json().catch(()=>null);
  if(!body || !Array.isArray(body.row_ids) || !body.row_ids.length || !["live","draft"].includes(body.action)){
    return new Response(JSON.stringify({ok:false,error:"action and row_ids required"}),{status:400,headers:{"Content-Type":"application/json"}});
  }
  const allowNonUS = body.admin==1 || body.publish_non_us==1;
  const batchId = Number(params.id);
  const db = env.DB;

  if(body.action==="draft"){
    const ids = body.row_ids.map(Number).filter(Boolean);
    const rows = await db.prepare(`SELECT id, parsed_json, errors_json FROM import_rows WHERE batch_id=? AND id IN (${ids.map(()=>'?').join(',')})`).bind(batchId, ...ids).all();
    const ins = await db.prepare(`INSERT INTO brand_drafts (source_row_id, data_json, issues_json) VALUES (?,?,?)`);
    for(const r of rows.results){ await ins.bind(r.id, r.parsed_json, r.errors_json).run(); }
    await db.prepare(`UPDATE import_batches SET status=? WHERE id=?`).bind("committed", batchId).run();
    return new Response(JSON.stringify({ok:true}),{headers:{"Content-Type":"application/json"}});
  }

  // live
  const ids = body.row_ids.map(Number).filter(Boolean);
  const rows = await db.prepare(`SELECT id, parsed_json FROM import_rows WHERE batch_id=? AND id IN (${ids.map(()=>'?').join(',')})`).bind(batchId, ...ids).all();

  const up = await db.prepare(`
    INSERT INTO brands (
      name,slug,domain,website_url,
      category_primary,category_secondary,category_tertiary,
      instagram_url,tiktok_url,logo_url,featured,description,
      is_public
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
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
      is_public=excluded.is_public
  `);

  for(const r of rows.results){
    const jo = JSON.parse(r.parsed_json||"{}");

    // Map and sanitize
    let name = String(jo.name||"").trim();
    if(!name && jo.brand_name) name = String(jo.brand_name).trim();
    const website_url = String(jo.website_url||"").trim();
    const domain = String(jo.domain||"").trim() || extractDomain(website_url);

    let slug = String(jo.slug||"").trim();
    if(!/^\d{6}$/.test(slug)) slug = await genSlug6(db);

    // US gating: prefer us_based "yes"
    const country = String(jo.country||"").trim().toUpperCase();
    const usFlag = String(jo.us_based||"").trim().toLowerCase()==="yes";
    const isUS = usFlag || country==="US" || country==="USA" || country==="UNITED STATES";
    const is_public = (isUS || allowNonUS) ? 1 : 0;

    await up.bind(
      name, slug, domain, website_url,
      String(jo.category_primary||"").trim(), String(jo.category_secondary||"").trim(), String(jo.category_tertiary||"").trim(),
      String(jo.instagram_url||"").trim(), String(jo.tiktok_url||"").trim(), String(jo.logo_url||"").trim(),
      toInt(jo.featured,0), String(jo.description||"").trim(),
      is_public
    ).run();
  }

  await db.prepare(`UPDATE import_batches SET status=? WHERE id=?`).bind("committed", batchId).run();
  return new Response(JSON.stringify({ok:true}),{headers:{"Content-Type":"application/json"}});
}
