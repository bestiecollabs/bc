export const config = { runtime: "edge" };

/**
 * POST /api/admin/import/brands/batches
 * Validates CSV header strictly, then stores each row into import_rows:
 *   (batch_id, row_num, parsed_json, errors_json, valid)
 * parsed_json keys align to brands schema.
 */
function forbidden(msg){return new Response(JSON.stringify({ok:false,error:msg}),{status:403,headers:{"content-type":"application/json"}})}
function bad(msg,obj){return new Response(JSON.stringify(Object.assign({ok:false,error:msg},obj||{})),{status:400,headers:{"content-type":"application/json"}})}

function parseCSV(text){
  const lines = text.split(/\r?\n/).filter(l=>l.trim().length>0);
  const rows = lines.map(l=>l.split(",").map(s=>s.trim()));
  return rows;
}

function normHeader(h){ return h.toLowerCase().replace(/\s+/g,"_"); }

export async function onRequestPost(ctx){
  const admin=ctx.request.headers.get("x-admin-email")||"";
  if(admin.toLowerCase()!=="collabsbestie@gmail.com") return forbidden("admin header required");

  const ct=(ctx.request.headers.get("content-type")||"").toLowerCase();
  let csv;
  if(ct.includes("application/json")){
    const j = await ctx.request.json().catch(()=>({}));
    csv = typeof j.csv==="string" ? j.csv : "";
  } else {
    csv = await ctx.request.text();
  }
  if(!csv || !csv.trim()) return bad("empty csv");

  const rows = parseCSV(csv);
  if(rows.length<2) return bad("no data rows");

  const headerLine = (rows[0]||[]).join(",");
  const hv = (typeof validateHeaders==="function") ? validateHeaders(headerLine) : { ok:false, errors:["validateHeaders() missing"] };
  if(!hv || hv.ok!==true) return bad("invalid header",{details:hv});

  const headers = rows[0].map(normHeader);
  const idx = Object.fromEntries(headers.map((h,i)=>[h,i]));

  // Create batch
  const insBatch = await ctx.env.DB.prepare(
    `INSERT INTO import_batches (created_at, source_uri, status) VALUES (datetime('now'),'inline:csv','new')`
  ).run();
  const batchId = String(insBatch.meta.last_row_id);

  // Insert rows
  let inserted=0;
  for(let i=1;i<rows.length;i++){
    const cols = rows[i];
    const obj:any = {
      name: cols[idx.name] || "",
      slug: cols[idx.slug] || "",
      website_url: cols[idx.website_url] || "",
      domain: cols[idx.domain] || "",
      category_primary: cols[idx.category_primary] || "",
      category_secondary: cols[idx.category_secondary] || "",
      category_tertiary: cols[idx.category_tertiary] || "",
      instagram_url: cols[idx.instagram_url] || "",
      tiktok_url: cols[idx.tiktok_url] || "",
      logo_url: cols[idx.logo_url] || "",
      description: cols[idx.description] || "",
      country: cols[idx.country] || "",
      state: cols[idx.state] || "",
      city: cols[idx.city] || "",
      zipcode: cols[idx.zipcode] || "",
      address: cols[idx.address] || "",
      contact_name: cols[idx.contact_name] || "",
      contact_title: cols[idx.contact_title] || "",
      contact_email: cols[idx.contact_email] || "",
      contact_phone: cols[idx.contact_phone] || "",
      customer_age_min: Number(cols[idx.customer_age_min]||0)||0,
      customer_age_max: Number(cols[idx.customer_age_max]||0)||0,
      price_low: Number(cols[idx.price_low]||0)||0,
      price_high: Number(cols[idx.price_high]||0)||0,
      affiliate_program: cols[idx.affiliate_program] || "",
      affiliate_cookie_days: Number(cols[idx.affiliate_cookie_days]||30)||30,
      monthly_visits: Number(cols[idx.monthly_visits]||0)||0,
      brand_values: cols[idx.brand_values] || "",
      gifting_ok: Number(cols[idx.gifting_ok]||0)||0,
      is_public: Number(cols[idx.is_public]||0)||0
    };
    const errors = [];
    if(!obj.name) errors.push("name required");
    if(!obj.website_url && !obj.domain) errors.push("website_url or domain required");

    await ctx.env.DB.prepare(`
      INSERT INTO import_rows (batch_id, row_num, parsed_json, errors_json, valid)
      VALUES (?1, ?2, ?3, ?4, ?5)
    `).bind(batchId, i, JSON.stringify(obj), JSON.stringify(errors), errors.length===0 ? 1 : 0).run();
    inserted++;
  }

  return new Response(JSON.stringify({ ok:true, id:batchId, rows:inserted }),{headers:{"content-type":"application/json"}});
}