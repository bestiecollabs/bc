function extractDomain(url){
  try{ const u=new URL(String(url||"").trim()); let d=u.hostname.toLowerCase(); if(d.startsWith("www.")) d=d.slice(4); return d; }catch(_){ return ""; }
}
function toInt(x, d=0){ const n=Number.parseInt(String(x??"").trim(),10); return Number.isFinite(n)?n:d; }
function toFloat(x, d=0){ const n=Number.parseFloat(String(x??"").trim()); return Number.isFinite(n)?n:d; }
async function genSlug6(db){
  for(let i=0;i<8;i++){ const s=String(Math.floor(100000+Math.random()*900000)); const hit=await db.prepare("SELECT 1 FROM brands WHERE slug=? LIMIT 1").bind(s).first(); if(!hit) return s; }
  return String(Date.now()).slice(-6);
}

export async function onRequestPost({ env, params, request }) {
  // Require JSON body
  const ct = (request.headers.get("content-type")||"").toLowerCase();
  if (!ct.includes("application/json")) {
    return new Response(JSON.stringify({ ok:false, error:"content-type must be application/json" }), { status:400, headers:{ "Content-Type":"application/json" }});
  }
  const body = await request.json().catch(()=>null);
  if (!body || !Array.isArray(body.row_ids) || !body.row_ids.length || !body.action) {
    return new Response(JSON.stringify({ ok:false, error:"action and row_ids required" }), { status:400, headers:{ "Content-Type":"application/json" }});
  }
  const action = String(body.action).toLowerCase();
  const ids = body.row_ids.map(Number).filter(Boolean);
  const batchId = Number(params.id);
  const db = env.DB;

  if (action === "draft") {
    const rows = await db.prepare(`SELECT id, parsed_json, errors_json FROM import_rows WHERE batch_id=? AND id IN (${ids.map(()=>"?").join(",")})`).bind(batchId, ...ids).all();
    const ins = await db.prepare(`INSERT INTO brand_drafts (source_row_id, data_json, issues_json) VALUES (?,?,?)`);
    for (const r of rows.results) { await ins.bind(r.id, r.parsed_json, r.errors_json).run(); }
    await db.prepare(`UPDATE import_batches SET status=? WHERE id=?`).bind("committed", batchId).run();
    return new Response(JSON.stringify({ ok:true }), { headers:{ "Content-Type":"application/json" }});
  }
  if (action !== "live") {
    return new Response(JSON.stringify({ ok:false, error:"invalid action" }), { status:400, headers:{ "Content-Type":"application/json" }});
  }

  const rows = await db.prepare(`SELECT id, parsed_json FROM import_rows WHERE batch_id=? AND id IN (${ids.map(()=>"?").join(",")})`).bind(batchId, ...ids).all();
  const up = await db.prepare(`
    INSERT INTO brands (
      name,slug,domain,website_url,
      category_primary,category_secondary,category_tertiary,
      instagram_url,tiktok_url,logo_url,featured,description,
      country,state,city,zipcode,address,
      contact_name,contact_title,contact_email,contact_phone,
      customer_age_min,customer_age_max,
      price_low,price_high,
      affiliate_program,affiliate_cookie_days,
      monthly_visits,brand_values,gifting_ok,
      is_public
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
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
      country=excluded.country,
      state=excluded.state,
      city=excluded.city,
      zipcode=excluded.zipcode,
      address=excluded.address,
      contact_name=excluded.contact_name,
      contact_title=excluded.contact_title,
      contact_email=excluded.contact_email,
      contact_phone=excluded.contact_phone,
      customer_age_min=excluded.customer_age_min,
      customer_age_max=excluded.customer_age_max,
      price_low=excluded.price_low,
      price_high=excluded.price_high,
      affiliate_program=excluded.affiliate_program,
      affiliate_cookie_days=excluded.affiliate_cookie_days,
      monthly_visits=excluded.monthly_visits,
      brand_values=excluded.brand_values,
      gifting_ok=excluded.gifting_ok,
      is_public=excluded.is_public
  `);

  for (const r of rows.results) {
    const jo = JSON.parse(r.parsed_json||"{}");
    const name = (jo.name||"").trim() || (jo.brand_name||"").trim();
    const website_url = (jo.website_url||"").trim();
    const domain = (jo.domain||"").trim() || extractDomain(website_url);
    let slug = (jo.slug||"").trim();
    if (!/^\d{6}$/.test(slug)) slug = await genSlug6(db);

    const country = (jo.country||"").trim().toUpperCase();
    const usFlag = String(jo.us_based||"").trim().toLowerCase();
    const isUS = (usFlag === "yes") || country === "US" || country === "USA" || country === "UNITED STATES";
    const is_public = isUS ? 1 : 0;

    await up.bind(
      name, slug, domain, website_url,
      (jo.category_primary||"").trim(), (jo.category_secondary||"").trim(), (jo.category_tertiary||"").trim(),
      (jo.instagram_url||"").trim(), (jo.tiktok_url||"").trim(), (jo.logo_url||"").trim(), toInt(jo.featured,0), (jo.description||"").trim(),
      country, (jo.state||"").trim(), (jo.city||"").trim(), (jo.zipcode||"").trim(), (jo.address||"").trim(),
      (jo.contact_name||"").trim(), (jo.contact_title||"").trim(), (jo.contact_email||"").trim(), (jo.contact_phone||"").trim(),
      toInt(jo.customer_age_min,0), toInt(jo.customer_age_max,0),
      toFloat(jo.price_low,0), toFloat(jo.price_high,0),
      (jo.affiliate_program||"").trim(), toInt(jo.affiliate_cookie_days,30),
      toInt(jo.monthly_visits,0), (jo.brand_values||"").trim(), toInt(jo.gifting_ok,0),
      is_public
    ).run();
  }
  await db.prepare(`UPDATE import_batches SET status=? WHERE id=?`).bind("committed", batchId).run();
  return new Response(JSON.stringify({ ok:true }), { headers:{ "Content-Type":"application/json" }});
}
