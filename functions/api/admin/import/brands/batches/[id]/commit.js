export async function onRequestPost({ env, params, request }) {
  const body = await request.json().catch(()=>({}));
  const action = body.action;
  const ids = Array.isArray(body.row_ids) ? body.row_ids.map(Number).filter(Boolean) : [];
  const allowNonUS = body.allow_non_us ? 1 : 0;
  if (!action || !ids.length) {
    return new Response(JSON.stringify({ ok:false, error:"action and row_ids required" }), { status:400, headers:{ "Content-Type":"application/json" }});
  }
  const batchId = Number(params.id);
  const db = env.DB;

  if (action === "live") {
    const q = `SELECT id, parsed_json FROM import_rows WHERE batch_id=? AND id IN (${ids.map(()=>'?').join(',')}) AND valid=1`;
    const rows = await db.prepare(q).bind(batchId, ...ids).all();
    const up = `
      INSERT INTO brands (name,slug,domain,website_url,category_primary,category_secondary,category_tertiary,instagram_url,tiktok_url,logo_url,featured,description,is_public,
                          customer_age_min,customer_age_max,price_low,price_high,affiliate_program,cookie_days,contact_email,contact_form_url,brand_values,monthly_site_visits,markets_primary)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(slug) DO UPDATE SET
        name=excluded.name, domain=excluded.domain, website_url=excluded.website_url,
        category_primary=excluded.category_primary, category_secondary=excluded.category_secondary, category_tertiary=excluded.category_tertiary,
        instagram_url=excluded.instagram_url, tiktok_url=excluded.tiktok_url, logo_url=excluded.logo_url, featured=excluded.featured,
        description=excluded.description, is_public=1,
        customer_age_min=excluded.customer_age_min, customer_age_max=excluded.customer_age_max,
        price_low=excluded.price_low, price_high=excluded.price_high,
        affiliate_program=excluded.affiliate_program, cookie_days=excluded.cookie_days,
        contact_email=excluded.contact_email, contact_form_url=excluded.contact_form_url,
        brand_values=excluded.brand_values, monthly_site_visits=excluded.monthly_site_visits,
        markets_primary=excluded.markets_primary
    `;
    const stmts = [];
    for (const r of rows.results) {
      const jo = JSON.parse(r.parsed_json);
      const mp = (jo.markets_primary||"").toUpperCase();
      if (mp !== "US" && !allowNonUS) {
        return new Response(JSON.stringify({ ok:false, error:"non-US brand blocked by policy; set allow_non_us=1 to override" }), { status:403, headers:{ "Content-Type":"application/json" }});
      }
      stmts.push(db.prepare(up).bind(
        jo.name, jo.slug, jo.domain, jo.website_url,
        jo.category_primary, jo.category_secondary, jo.category_tertiary,
        jo.instagram_url, jo.tiktok_url, jo.logo_url, jo.featured||0, jo.description||"",
        jo.customer_age_min??null, jo.customer_age_max??null, jo.price_low??null, jo.price_high??null,
        jo.affiliate_program?1:0, jo.cookie_days||30, jo.contact_email||"", jo.contact_form_url||"",
        jo.brand_values||"", jo.monthly_site_visits??null, (jo.markets_primary||"US")
      ));
    }
    if (stmts.length) await db.batch(stmts);
  } else if (action === "draft") {
    const q = `SELECT id, parsed_json, errors_json FROM import_rows WHERE batch_id=? AND id IN (${ids.map(()=>'?').join(',')})`;
    const rows = await db.prepare(q).bind(batchId, ...ids).all();
    const stmts = rows.results.map(r => env.DB.prepare(
      "INSERT INTO brand_drafts (source_row_id, data_json, issues_json, created_at) VALUES (?,?,?,?)"
    ).bind(r.id, r.parsed_json, r.errors_json, new Date().toISOString()));
    if (stmts.length) await env.DB.batch(stmts);
  } else {
    return new Response(JSON.stringify({ ok:false, error:"invalid action" }), { status:400, headers:{ "Content-Type":"application/json" }});
  }

  await env.DB.prepare("UPDATE import_batches SET status=? WHERE id=?").bind("committed", batchId).run();
  return new Response(JSON.stringify({ ok:true }), { headers:{ "Content-Type":"application/json" }});
}
