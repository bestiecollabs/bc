function parseCSV(text){const rows=[];let i=0,cur="",q=false,row=[];while(i<text.length){const ch=text[i];if(q){if(ch=='"'&&text[i+1]=='"'){cur+='"';i+=2;continue}if(ch=='"'){q=false;i++;continue}cur+=ch;i++;continue}if(ch=='"'){q=true;i++;continue}if(ch==','){row.push(cur);cur="";i++;continue}if(ch=='\r'){i++;continue}if(ch=='\n'){row.push(cur);rows.push(row);row=[];cur="";i++;continue}cur+=ch;i++;continue}row.push(cur);rows.push(row);return rows}
function truthy(v){const s=String(v??"").trim().toLowerCase();return s==="1"||s==="true"||s==="yes"||s==="y"}
function extractDomain(url){try{const u=new URL(String(url||"").trim());let d=u.hostname.toLowerCase();if(d.startsWith("www.")) d=d.slice(4);return d}catch{ return "" }}

export async function onRequestGet({ env }){
  const rs = await env.DB.prepare(`SELECT id, source_uri, status, created_at FROM import_batches ORDER BY id DESC LIMIT 50`).all();
  return new Response(JSON.stringify({ ok:true, batches: rs.results }), { headers:{ "Content-Type":"application/json" }});
}

export async function onRequestPost({ request, env }){
  const ct = (request.headers.get("content-type")||"").toLowerCase();
  const body = (await request.text()||"").trim();
  if(!body) return new Response(JSON.stringify({ ok:false, error:"empty body" }), { status:400, headers:{ "Content-Type":"application/json" }});

  // Accept text/csv or text/plain
  if(!(ct.includes("text/plain")||ct.includes("text/csv"))){
    return new Response(JSON.stringify({ ok:false, error:"content-type must be text/plain or text/csv" }), { status:400, headers:{ "Content-Type":"application/json" }});
  }

  const rows = parseCSV(body);
  if(rows.length<2) return new Response(JSON.stringify({ ok:false, error:"no rows" }), { status:400, headers:{ "Content-Type":"application/json" }});

  const headers = rows[0].map(h=>String(h||"").trim());
  const idx = Object.fromEntries(headers.map((h,i)=>[h,i]));
  const get = (name)=> String(idx[name]!=null ? rows[r][idx[name]]||"" : "").trim();

  const db = env.DB;
  await db.exec("BEGIN");
  try{
    const now = new Date().toISOString();
    await db.prepare("INSERT INTO import_batches (source_uri,status,created_at) VALUES (?,?,?)").bind("ui-upload","staged",now).run();
    const bid = (await db.prepare("SELECT last_insert_rowid() as id").first()).id;

    const insRow = await db.prepare(`INSERT INTO import_rows (batch_id,row_num,data_json,valid,errs_json) VALUES (?,?,?,?,?)`);
    for(let r=1;r<rows.length;r++){
      const jo = {
        name: get("name")||get("brand_name"),
        slug: "",
        website_url: get("website_url"),
        domain: extractDomain(get("website_url")),
        category_primary: get("category_primary"),
        category_secondary: get("category_secondary"),
        category_tertiary: get("category_tertiary"),
        instagram_url: get("instagram_url"),
        tiktok_url: get("tiktok_url"),
        logo_url: get("logo_url"),
        featured: 0,
        description: get("description"),
        customer_age_min: parseInt(get("customer_age_min")||"0",10)||0,
        customer_age_max: parseInt(get("customer_age_max")||"0",10)||0,
        us_based: truthy(get("us_based")) ? 1 : 0
      };
      const errs=[];
      if(!jo.name) errs.push("name required");
      if(!jo.website_url) errs.push("website_url required");
      const valid = errs.length===0 ? 1 : 0;
      await insRow.bind(bid, r, JSON.stringify(jo), valid, JSON.stringify(errs)).run();
    }

    const counts = await db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN valid=1 THEN 1 ELSE 0 END) as valid,
        SUM(CASE WHEN valid=0 THEN 1 ELSE 0 END) as invalid
      FROM import_rows WHERE batch_id=?`).bind(bid).first();

    await db.exec("COMMIT");
    return new Response(JSON.stringify({ ok:true, batch_id: bid, counts }), { headers:{ "Content-Type":"application/json" }});
  }catch(e){
    await db.exec("ROLLBACK");
    return new Response(JSON.stringify({ ok:false, error:String(e) }), { status:500, headers:{ "Content-Type":"application/json" }});
  }
}

export async function onRequestOptions(){
  return new Response(null,{ status:204, headers:{
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Methods":"GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":"content-type"
  }});
}
