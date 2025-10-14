/**
 * functions/api/admin/import/brands/batches.js
 * GET  -> list latest batches
 * POST -> upload CSV, create batch + rows, return counts
 * No SQL BEGIN/COMMIT; autocommit + db.batch()
 */

function parseCSV(text){
  const rows=[]; let i=0, cur="", inQ=false, row=[];
  while(i<text.length){
    const ch=text[i];
    if(inQ){
      if(ch === '"' && text[i+1] === '"'){ cur+='"'; i+=2; continue; }
      if(ch === '"'){ inQ=false; i++; continue; }
      cur+=ch; i++; continue;
    }
    if(ch === '"'){ inQ=true; i++; continue; }
    if(ch === ','){ row.push(cur); cur=""; i++; continue; }
    if(ch === '\r'){ i++; continue; }
    if(ch === '\n'){ row.push(cur); rows.push(row); row=[]; cur=""; i++; continue; }
    cur+=ch; i++; continue;
  }
  row.push(cur); rows.push(row);
  return rows;
}

function truthyFlag(v){
  const s = String(v??"").trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y";
}
function toInt(x, def=0){
  const n = Number.parseInt(String(x??"").trim(), 10);
  return Number.isFinite(n) ? n : def;
}
function toFloat(x, def=0){
  const n = Number.parseFloat(String(x??"").trim());
  return Number.isFinite(n) ? n : def;
}
function extractDomain(url){
  try{
    const u = new URL(String(url||"").trim());
    let d = u.hostname.toLowerCase();
    if (d.startsWith("www.")) d = d.slice(4);
    return d;
  }catch(_){ return ""; }
}

function normalizeRow(row, idx){
  // Detect Agent vs Admin by presence of brand_name
  const isAgent = idx["brand_name"] != null;

  if (isAgent){
    const name = String(row[idx["brand_name"]]||"").trim();
    const website_url = String(row[idx["website_url"]]||"").trim();
    const jo = {
      name,
      slug: "", // 6-digit numeric generated at commit
      website_url,
      domain: extractDomain(website_url),
      category_primary: String(row[idx["category_primary"]]||"").trim(),
      category_secondary: idx["category_secondary"]!=null ? String(row[idx["category_secondary"]]||"").trim() : "",
      category_tertiary: idx["category_tertiary"]!=null ? String(row[idx["category_tertiary"]]||"").trim() : "",
      instagram_url: String(row[idx["instagram_url"]]||"").trim(),
      tiktok_url: String(row[idx["tiktok_url"]]||"").trim(),
      logo_url: idx["logo_url"]!=null ? String(row[idx["logo_url"]]||"").trim() : "",
      description: String(row[idx["description"]]||"").trim(),
      // US gating: set country=US if us_based truthy; otherwise blank to require admin override
      country: truthyFlag(idx["us_based"]!=null ? row[idx["us_based"]] : "") ? "US" : "",
      state: "",
      city: "",
      zipcode: "",
      address: "",
      contact_name: "",
      contact_title: "",
      contact_email: String(idx["contact_email"]!=null ? row[idx["contact_email"]]||"" : "").trim(),
      contact_phone: "",
      customer_age_min: toInt(idx["customer_age_min"]!=null ? row[idx["customer_age_min"]] : "", 0),
      customer_age_max: toInt(idx["customer_age_max"]!=null ? row[idx["customer_age_max"]] : "", 0),
      price_low: toFloat(idx["price_low"]!=null ? row[idx["price_low"]] : "", 0),
      price_high: toFloat(idx["price_high"]!=null ? row[idx["price_high"]] : "", 0),
      affiliate_program: String(idx["has_affiliate_program"]!=null ? row[idx["has_affiliate_program"]]||"" : "").trim(),
      affiliate_cookie_days: 30,
      monthly_visits: toInt(idx["monthly_visits"]!=null ? row[idx["monthly_visits"]] : "", 0),
      brand_values: "",
      gifting_ok: 0,
      // carry agent-only metadata in parsed_json for later enrichment
      customer_locations: String(idx["customer_locations"]!=null ? row[idx["customer_locations"]]||"" : "").trim(),
      source_url: String(idx["source_url"]!=null ? row[idx["source_url"]]||"" : "").trim(),
      discovered_at: String(idx["discovered_at"]!=null ? row[idx["discovered_at"]]||"" : "").trim(),
      discovered_by: String(idx["discovered_by"]!=null ? row[idx["discovered_by"]]||"" : "").trim(),
      notes_admin: String(idx["notes_admin"]!=null ? row[idx["notes_admin"]]||"" : "").trim(),
      featured: 0,
      is_public: 0
    };
    const errs = [];
    if (!jo.name) errs.push("name required");
    if (!jo.website_url) errs.push("website_url required");
    return { jo, valid: errs.length===0 ? 1 : 0, errs };
  }

  // Admin template path
  const reqName = String(row[idx["name"]]||"").trim();
  const reqUrl  = String(row[idx["website_url"]]||"").trim();
  const jo = {
    name: reqName,
    slug: "",
    website_url: reqUrl,
    domain: extractDomain(reqUrl),
    category_primary: String(row[idx["category_primary"]]||"").trim(),
    category_secondary: idx["category_secondary"]!=null ? String(row[idx["category_secondary"]]||"").trim() : "",
    category_tertiary: idx["category_tertiary"]!=null ? String(row[idx["category_tertiary"]]||"").trim() : "",
    instagram_url: String(idx["instagram_url"]!=null ? row[idx["instagram_url"]]||"" : "").trim(),
    tiktok_url: String(idx["tiktok_url"]!=null ? row[idx["tiktok_url"]]||"" : "").trim(),
    logo_url: String(idx["logo_url"]!=null ? row[idx["logo_url"]]||"" : "").trim(),
    description: String(idx["description"]!=null ? row[idx["description"]]||"" : "").trim(),
    country: String(idx["country"]!=null ? row[idx["country"]]||"" : "").trim(),
    state: String(idx["state"]!=null ? row[idx["state"]]||"" : "").trim(),
    city: String(idx["city"]!=null ? row[idx["city"]]||"" : "").trim(),
    zipcode: String(idx["zipcode"]!=null ? row[idx["zipcode"]]||"" : "").trim(),
    address: String(idx["address"]!=null ? row[idx["address"]]||"" : "").trim(),
    contact_name: String(idx["contact_name"]!=null ? row[idx["contact_name"]]||"" : "").trim(),
    contact_title: String(idx["contact_title"]!=null ? row[idx["contact_title"]]||"" : "").trim(),
    contact_email: String(idx["contact_email"]!=null ? row[idx["contact_email"]]||"" : "").trim(),
    contact_phone: String(idx["contact_phone"]!=null ? row[idx["contact_phone"]]||"" : "").trim(),
    customer_age_min: toInt(idx["customer_age_min"]!=null ? row[idx["customer_age_min"]] : "", 0),
    customer_age_max: toInt(idx["customer_age_max"]!=null ? row[idx["customer_age_max"]] : "", 0),
    price_low: toFloat(idx["price_low"]!=null ? row[idx["price_low"]] : "", 0),
    price_high: toFloat(idx["price_high"]!=null ? row[idx["price_high"]] : "", 0),
    affiliate_program: String(idx["affiliate_program"]!=null ? row[idx["affiliate_program"]]||"" : "").trim(),
    affiliate_cookie_days: toInt(idx["affiliate_cookie_days"]!=null ? row[idx["affiliate_cookie_days"]] : "", 30),
    monthly_visits: toInt(idx["monthly_visits"]!=null ? row[idx["monthly_visits"]] : "", 0),
    brand_values: String(idx["brand_values"]!=null ? row[idx["brand_values"]]||"" : "").trim(),
    gifting_ok: toInt(idx["gifting_ok"]!=null ? row[idx["gifting_ok"]] : "", 0),
    shopify_shop_id: String(idx["shopify_shop_id"]!=null ? row[idx["shopify_shop_id"]]||"" : "").trim(),
    shopify_public_url: String(idx["shopify_public_url"]!=null ? row[idx["shopify_public_url"]]||"" : "").trim(),
    shopify_shop_domain: String(idx["shopify_shop_domain"]!=null ? row[idx["shopify_shop_domain"]]||"" : "").trim(),
    notes_admin: String(idx["notes_admin"]!=null ? row[idx["notes_admin"]]||"" : "").trim(),
    featured: toInt(idx["featured"]!=null ? row[idx["featured"]] : "", 0),
    is_public: 0
  };
  const errs = [];
  if (!jo.name) errs.push("name required");
  if (!jo.website_url) errs.push("website_url required");
  return { jo, valid: errs.length===0 ? 1 : 0, errs };
}

export async function onRequestGet({ env }){
  const rs = await env.DB
    .prepare("SELECT id,created_at,source_uri,status FROM import_batches ORDER BY id DESC LIMIT 50")
    .all();
  return new Response(JSON.stringify({ ok:true, batches: rs.results }), { headers:{ "Content-Type":"application/json" }});
}

export async function onRequestPost({ request, env }){
  const db = env.DB;
  const ct = (request.headers.get("content-type") || "").toLowerCase();
  if(!ct.includes("text/csv")){
    return new Response(JSON.stringify({ ok:false, error:"content-type must be text/csv" }), { status:400, headers:{ "Content-Type":"application/json" }});
  }
  const body = (await request.text() || "").trim();
  if(!body){
    return new Response(JSON.stringify({ ok:false, error:"empty body" }), { status:400, headers:{ "Content-Type":"application/json" }});
  }

  const rows = parseCSV(body);
  if(rows.length < 2){
    return new Response(JSON.stringify({ ok:false, error:"no rows" }), { status:400, headers:{ "Content-Type":"application/json" }});
  }

  const headers = rows[0].map(h => String(h||"").trim());
  const idx = Object.fromEntries(headers.map((h,i)=>[h,i]));

  try{
    const now = new Date().toISOString();
    await db.prepare("INSERT INTO import_batches (source_uri,status,created_at) VALUES (?,?,?)")
      .bind("inline:csv","new",now).run();
    const idRow = await db.prepare("SELECT last_insert_rowid() AS id").first();
    const batchId = Number(idRow?.id || 0);

    const stmts = [];
    const insert = "INSERT INTO import_rows (batch_id,row_num,parsed_json,errors_json,valid) VALUES (?,?,?,?,?)";

    for(let r=1;r<rows.length;r++){
      const row = rows[r];
      if(row.length===1 && String(row[0]||"").trim()==="") continue;

      const { jo, valid, errs } = normalizeRow(row, idx);
      stmts.push(db.prepare(insert).bind(batchId, r, JSON.stringify(jo), JSON.stringify(errs), valid));
    }

    if (stmts.length) await db.batch(stmts);

    const counts = await db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN valid=1 THEN 1 ELSE 0 END),0) AS valid,
        COALESCE(SUM(CASE WHEN valid=0 THEN 1 ELSE 0 END),0) AS invalid,
        COUNT(*) AS total
      FROM import_rows WHERE batch_id=?`).bind(batchId).first();

    return new Response(JSON.stringify({ ok:true, batch_id: batchId, counts }), { headers:{ "Content-Type":"application/json" }});
  }catch(e){
    return new Response(JSON.stringify({ ok:false, error:String(e) }), { status:500, headers:{ "Content-Type":"application/json" }});
  }
}
