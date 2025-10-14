/**
 * functions/api/admin/import/brands/batches.js
 * GET  -> list latest batches
 * POST -> upload CSV, create batch + rows, return counts
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

function toDomain(url){
  try{ const u=new URL(url); return u.hostname.replace(/^www\./,''); }catch{ return ""; }
}

function sixDigit(){
  return String(Math.floor(Math.random()*1_000_000)).padStart(6,"0");
}

function validateBrand(jo){
  const errs=[];
  if(!jo.name) errs.push("name required");
  if(!jo.website_url) errs.push("website_url required");
  // clamp ages
  if(jo.customer_age_min!=null){ jo.customer_age_min = Math.max(0, Math.min(120, Number(jo.customer_age_min)||0)); }
  if(jo.customer_age_max!=null){ jo.customer_age_max = Math.max(0, Math.min(120, Number(jo.customer_age_max)||0)); }
  if(jo.customer_age_min!=null && jo.customer_age_max!=null && jo.customer_age_min>jo.customer_age_max){
    const t=jo.customer_age_min; jo.customer_age_min=jo.customer_age_max; jo.customer_age_max=t;
  }
  return { valid: errs.length===0 ? 1 : 0, errs };
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
  if(!body){ return new Response(JSON.stringify({ ok:false, error:"empty body" }), { status:400, headers:{ "Content-Type":"application/json" }}); }

  const rows = parseCSV(body);
  if(rows.length < 2){ return new Response(JSON.stringify({ ok:false, error:"no rows" }), { status:400, headers:{ "Content-Type":"application/json" }}); }

  const headers = rows[0].map(h => String(h||"").trim());
  const idx = Object.fromEntries(headers.map((h,i)=>[h,i]));
  const fields = [
    "name","slug","domain","website_url",
    "category_primary","category_secondary","category_tertiary",
    "instagram_url","tiktok_url","logo_url","featured","description",
    "customer_age_min","customer_age_max","price_low","price_high",
    "affiliate_program","cookie_days","contact_email","contact_form_url",
    "brand_values","monthly_site_visits","markets_primary"
  ];

  // Insert batch
  const now = new Date().toISOString();
  await db.prepare("INSERT INTO import_batches (source_uri,status,created_at) VALUES (?,?,?)")
    .bind("inline:csv","new",now).run();
  const idRow = await db.prepare("SELECT last_insert_rowid() AS id").first();
  const batchId = Number(idRow?.id || 0);

  // Insert rows
  const stmts = [];
  const insert = "INSERT INTO import_rows (batch_id,row_num,parsed_json,errors_json,valid) VALUES (?,?,?,?,?)";

  // For uniqueness check in a single batch, track slugs we generate
  const seen = new Set();
  for(let r=1;r<rows.length;r++){
    const row = rows[r];
    if(row.length===1 && String(row[0]||"").trim()==="") continue;

    const jo = {};
    for(const f of fields){ jo[f] = idx[f]!=null ? String(row[idx[f]]||"").trim() : ""; }

    // defaults and coercions
    jo.website_url = jo.website_url || "";
    jo.domain = jo.domain || toDomain(jo.website_url);
    jo.cookie_days = jo.cookie_days ? Number(jo.cookie_days) : 30;
    jo.affiliate_program = jo.affiliate_program ? Number(jo.affiliate_program) : 0;
    jo.price_low = jo.price_low ? Number(jo.price_low) : null;
    jo.price_high = jo.price_high ? Number(jo.price_high) : null;
    jo.monthly_site_visits = jo.monthly_site_visits ? Number(jo.monthly_site_visits) : null;
    jo.markets_primary = jo.markets_primary || "US";

    // 6-digit slug generation if missing or duplicate in this batch
    let s = (jo.slug||"").replace(/\D/g,""); // keep digits only
    if (!s || seen.has(s)) { s = sixDigit(); while(seen.has(s)) s = sixDigit(); }
    jo.slug = s; seen.add(s);

    const { valid, errs } = validateBrand(jo);
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
}
