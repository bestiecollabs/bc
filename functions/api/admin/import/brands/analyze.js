import { ACCEPTED_HEADERS_11, validateHeaderList } from './_headers.js';
/**
 * functions/api/admin/import/brands/analyze.js
 * Dry-run CSV analysis for Brand Template. NO DB WRITES.
 * Input: text/csv body with 11 headers.
 * Output: { ok, counts: { total, valid, invalid }, inserted:0, updated:0, skipped:0, failed, errors:[], warnings:[], rows:[{line,status,issues:[],data:{...}}] }
 */
const REQUIRED = [
  "brand_name","website_url",
  "category_primary","category_secondary","category_tertiary",
  "instagram_url","tiktok_url",
  "description",
  "customer_age_min","customer_age_max",
  "us_based"
];

function parseCSV(text){
  const lines = text.replace(/\r\n/g,"\n").replace(/\r/g,"\n").split("\n").filter(l=>l.length>0);
  const rows = lines.map(l=>l.split(",").map(x=>x.trim()));
  return rows;
}

function normalize(row, idx){
  const get = (k)=> {
    const i = idx[k];
    return i==null ? "" : String(row[i] ?? "").trim();
  };
  return {
    brand_name: get("brand_name"),
    website_url: get("website_url"),
    category_primary: get("category_primary"),
    category_secondary: get("category_secondary"),
    category_tertiary: get("category_tertiary"),
    instagram_url: get("instagram_url"),
    tiktok_url: get("tiktok_url"),
    description: get("description"),
    customer_age_min: get("customer_age_min"),
    customer_age_max: get("customer_age_max"),
    us_based: get("us_based")
  };
}

function validate(hdrs){
  const missing = REQUIRED.filter(h=>!hdrs.includes(h));
  const extra = hdrs.filter(h=>!REQUIRED.includes(h));
  return {missing, extra};
}

function checks(rec){
  const issues = [];
  const urlOk = (u)=> !u || /^https?:\/\/[^\s]+$/i.test(u);
  const boolOk = (v)=> !v || /^(true|false)$/i.test(v);
  const intOk = (v)=> !v || /^\d+$/.test(v);
  if(!rec.brand_name) issues.push("brand_name required");
  if(!rec.website_url) issues.push("website_url required");
  if(rec.website_url && !urlOk(rec.website_url)) issues.push("website_url invalid");
  if(rec.instagram_url && !urlOk(rec.instagram_url)) issues.push("instagram_url invalid");
  if(rec.tiktok_url && !urlOk(rec.tiktok_url)) issues.push("tiktok_url invalid");
  if(rec.customer_age_min && !intOk(rec.customer_age_min)) issues.push("customer_age_min not integer");
  if(rec.customer_age_max && !intOk(rec.customer_age_max)) issues.push("customer_age_max not integer");
  if(rec.customer_age_min && rec.customer_age_max && Number(rec.customer_age_min)>Number(rec.customer_age_max)) issues.push("age min > max");
  if(rec.us_based && !boolOk(rec.us_based)) issues.push("us_based must be true/false");
  return issues;
}

export async function onRequestPost({request}) {
  try{
    const ct = (request.headers.get("content-type")||"").toLowerCase();
    if(!ct.includes("text/csv")) {
      return new Response(JSON.stringify({ ok:false, error:"content-type must be text/csv" }), { status:400, headers:{ "Content-Type":"application/json" }});
    }
    const text = await request.text();
    if(!text.trim()){
      return new Response(JSON.stringify({ ok:false, error:"empty body" }), { status:400, headers:{ "Content-Type":"application/json" }});
    }
    const rows = parseCSV(text);
    if(rows.length<1){
      return new Response(JSON.stringify({ ok:false, error:"no rows" }), { status:400, headers:{ "Content-Type":"application/json" }});
    }
    const headers = rows[0].map(h=>String(h||"").trim());
    {
  const chk = validateHeaderList(headers);
  if (!chk.ok){
    return new Response(JSON.stringify({
      ok:false,
      error:"invalid_csv_headers",
      missing: chk.missing,
      extras: chk.extras,
      expected: chk.expected
    }), { status:400, headers:{ "Content-Type":"application/json" }});
  }
}const {missing, extra} = validate(headers);
    const idx = Object.fromEntries(headers.map((h,i)=>[h,i]));
    const errors = [];
    const warnings = [];

    if(missing.length){ errors.push(`missing headers: ${missing.join(", ")}`); }
    if(extra.length){ warnings.push(`ignored extra headers: ${extra.join(", ")}`); }

    const outRows = [];
    let valid=0, invalid=0;

    for(let i=1;i<rows.length;i++){
      const rec = normalize(rows[i], idx);
      const issues = checks(rec);
      if(issues.length){ invalid++; } else { valid++; }
      outRows.push({ line:i+1, status: issues.length ? "error":"ok", issues, data: rec });
    }

    const body = {
      ok: errors.length===0,
      counts: { total: rows.length-1, valid, invalid },
      inserted: 0, updated: 0, skipped: 0, failed: invalid,
      errors, warnings,
      rows: outRows
    };
    return new Response(JSON.stringify(body), { headers:{ "Content-Type":"application/json" }});
  }catch(e){
    return new Response(JSON.stringify({ ok:false, error:String(e) }), { status:500, headers:{ "Content-Type":"application/json" }});
  }
}