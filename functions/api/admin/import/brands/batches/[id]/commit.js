import { ACCEPTED_HEADERS_11 } from '../../_headers.js';
/**
 * functions/api/admin/import/brands/batches/[id]/commit.js
 * POST JSON body:
 * { "action":"live"|"draft", "row_ids":[...], "admin":0|1, "publish_non_us":0|1 }
 */

function extractDomain(url) {
  try {
    var u = new URL(String(url || "").trim());
    var d = u.hostname.toLowerCase();
    if (d.indexOf("www.") === 0) d = d.slice(4);
    return d;
  } catch (_) { return ""; }
}
function toInt(x, defVal) {
  if (defVal === undefined) defVal = 0;
  var n = parseInt(String(x == null ? "" : x).trim(), 10);
  return isFinite(n) ? n : defVal;
}
function toFloat(x, defVal) {
  if (defVal === undefined) defVal = 0;
  var n = parseFloat(String(x == null ? "" : x).trim());
  return isFinite(n) ? n : defVal;
}
async function genSlug6(db) {
  for (var i = 0; i < 8; i++) {
    var s = String(Math.floor(100000 + Math.random() * 900000));
    var hit = await db.prepare("SELECT 1 FROM brands WHERE slug=? LIMIT 1").bind(s).first();
    if (!hit) return s;
  }
  return String(Date.now()).slice(-6);
}

export async function onRequestPost(ctx) {
  var env = ctx.env, params = ctx.params, request = ctx.request;
  var body = await request.json().catch(function(){ return {}; });
  var action = body.action;
  var ids = Array.isArray(body.row_ids) ? body.row_ids.map(Number).filter(Boolean) : [];
  if (!action || !ids.length) {
    return new Response(JSON.stringify({ ok:false, error:"action and row_ids required" }), { status:400, headers:{ "Content-Type":"application/json" }});
  }
  var allowNonUS = (body.admin === 1) || (body.publish_non_us === 1);

  var db = env.DB;

  try {
    if (action === "draft") {
      var rowsD = await db.prepare(
        "SELECT id, parsed_json, errors_json FROM import_rows WHERE batch_id=? AND id IN (" + ids.map(function(){return "?";}).join(",") + ")"
      ).bind(Number(params.id), ...ids).all();
      var ins = await db.prepare("INSERT INTO brand_drafts (source_row_id, data_json, issues_json) VALUES (?,?,?)");
      for (var i=0;i<rowsD.results.length;i++) {
        var r = rowsD.results[i];
        await ins.bind(r.id, r.parsed_json, r.errors_json).run();
      }
      await db.prepare("UPDATE import_batches SET status=? WHERE id=?").bind("committed", Number(params.id)).run();
      return new Response(JSON.stringify({ ok:true }), { headers:{ "Content-Type":"application/json" }});
    }

    if (action !== "live") {
      return new Response(JSON.stringify({ ok:false, error:"invalid action" }), { status:400, headers:{ "Content-Type":"application/json" }});
    }

    var rows = await db.prepare(
      "SELECT id, parsed_json FROM import_rows WHERE batch_id=? AND id IN (" + ids.map(function(){return "?";}).join(",") + ")"
    ).bind(Number(params.id), ...ids).all();

    var up = await db.prepare(
      "INSERT INTO brands (" +
      "name,slug,domain,website_url," +
      "category_primary,category_secondary,category_tertiary," +
      "instagram_url,tiktok_url,logo_url,featured,description," +
      "country,state,city,zipcode,address," +
      "contact_name,contact_title,contact_email,contact_phone," +
      "customer_age_min,customer_age_max," +
      "price_low,price_high," +
      "affiliate_program,affiliate_cookie_days," +
      "monthly_visits,brand_values,gifting_ok," +
      "is_public" +
      ") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) " +
      "ON CONFLICT(slug) DO UPDATE SET " +
      "name=excluded.name," +
      "domain=excluded.domain," +
      "website_url=excluded.website_url," +
      "category_primary=excluded.category_primary," +
      "category_secondary=excluded.category_secondary," +
      "category_tertiary=excluded.category_tertiary," +
      "instagram_url=excluded.instagram_url," +
      "tiktok_url=excluded.tiktok_url," +
      "logo_url=excluded.logo_url," +
      "featured=excluded.featured," +
      "description=excluded.description," +
      "country=excluded.country," +
      "state=excluded.state," +
      "city=excluded.city," +
      "zipcode=excluded.zipcode," +
      "address=excluded.address," +
      "contact_name=excluded.contact_name," +
      "contact_title=excluded.contact_title," +
      "contact_email=excluded.contact_email," +
      "contact_phone=excluded.contact_phone," +
      "customer_age_min=excluded.customer_age_min," +
      "customer_age_max=excluded.customer_age_max," +
      "price_low=excluded.price_low," +
      "price_high=excluded.price_high," +
      "affiliate_program=excluded.affiliate_program," +
      "affiliate_cookie_days=excluded.affiliate_cookie_days," +
      "monthly_visits=excluded.monthly_visits," +
      "brand_values=excluded.brand_values," +
      "gifting_ok=excluded.gifting_ok," +
      "is_public=excluded.is_public"
    );

    for (var j=0;j<rows.results.length;j++) {
      var jo = {};
      try { jo = JSON.parse(rows.results[j].parsed_json || "{}"); } catch(_) {}

      var name = String(jo.name || "").trim();
      if (!name && jo.brand_name) name = String(jo.brand_name).trim();

      var website_url = String(jo.website_url || "").trim();
      var domain = String(jo.domain || "").trim();
      if (!domain) domain = extractDomain(website_url);

      var slug = String(jo.slug || "").trim();
      if (!/^\d{6}$/.test(slug)) {
        slug = await genSlug6(db);
      }

      var country = String(jo.country || "").trim().toUpperCase();
      var usBasedFlag = String(jo.us_based || "").trim().toLowerCase();
      var isUS = (usBasedFlag === "yes" || usBasedFlag === "true" || usBasedFlag === "1") ||
                 country === "US" || country === "USA" || country === "UNITED STATES";
      var is_public = (isUS || allowNonUS) ? 1 : 0;

      await up.bind(
        name, slug, domain, website_url,
        String(jo.category_primary||"").trim(), String(jo.category_secondary||"").trim(), String(jo.category_tertiary||"").trim(),
        String(jo.instagram_url||"").trim(), String(jo.tiktok_url||"").trim(), String(jo.logo_url||"").trim(), toInt(jo.featured,0), String(jo.description||"").trim(),
        country, String(jo.state||"").trim(), String(jo.city||"").trim(), String(jo.zipcode||"").trim(), String(jo.address||"").trim(),
        String(jo.contact_name||"").trim(), String(jo.contact_title||"").trim(), String(jo.contact_email||"").trim(), String(jo.contact_phone||"").trim(),
        toInt(jo.customer_age_min,0), toInt(jo.customer_age_max,0),
        toFloat(jo.price_low,0), toFloat(jo.price_high,0),
        String(jo.affiliate_program||"").trim(), toInt(jo.affiliate_cookie_days,30),
        toInt(jo.monthly_visits,0), String(jo.brand_values||"").trim(), toInt(jo.gifting_ok,0),
        is_public
      ).run();
    }

    await db.prepare("UPDATE import_batches SET status=? WHERE id=?").bind("committed", Number(params.id)).run();
    return new Response(JSON.stringify({ ok:true }), { headers:{ "Content-Type":"application/json" }});

  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:String(e) }), { status:500, headers:{ "Content-Type":"application/json" }});
  }
}
