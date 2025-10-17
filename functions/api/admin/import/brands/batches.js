export const config = { runtime: "edge" };

/**
 * POST /api/admin/import/brands/batches
 * Accepts CSV. Validates headers strictly via validateHeaders(headerLine).
 * On invalid headers: 400 + errors. On valid: creates batch + import_rows.
 * Note: uses existing helper `validateHeaders` already present in your codebase.
 */
function forbidden(msg){return new Response(JSON.stringify({ok:false,error:msg}),{status:403,headers:{"content-type":"application/json"}})}
function bad(msg,obj){return new Response(JSON.stringify(Object.assign({ok:false,error:msg},obj||{})),{status:400,headers:{"content-type":"application/json"}})}

async function readBodyText(req){
  const ct=(req.headers.get("content-type")||"").toLowerCase()
  if(ct.includes("application/json")){
    const j=await req.json()
    if(typeof j.csv==="string") return j.csv
  }
  return await req.text()
}

// You already have validateHeaders(headerLine) in the repo.
// If not, this will 500 which is acceptable during dev to reveal missing symbol.
export async function onRequestPost(ctx){
  const admin=ctx.request.headers.get("x-admin-email")||""
  if(admin.toLowerCase()!=="collabsbestie@gmail.com") return forbidden("admin header required")

  const csv=await readBodyText(ctx.request)
  if(!csv || !csv.trim()) return bad("empty csv")

  const rows=csv.split(/\r?\n/).filter(l=>l.trim().length>0).map(l=>l.split(","))
  if(rows.length<2) return bad("no data rows")

  const headerLine=(rows[0]||[]).join(",")
  const hv = (typeof validateHeaders==="function") ? validateHeaders(headerLine) : { ok:false, errors:["validateHeaders() missing"] }
  if(!hv || hv.ok!==true){
    return bad("invalid header", { details: hv })
  }

  // create import_batches row
  const insBatch = await ctx.env.DB.prepare(
    `INSERT INTO import_batches (source_uri, status, created_at) VALUES (?1, 'new', datetime('now'))`
  ).bind("inline:csv").run()
  const batchId = String(insBatch.meta.last_row_id)

  // insert import_rows
  let inserted=0
  for(let i=1;i<rows.length;i++){
    const cols=rows[i]
    const brand_name=(cols[0]||"").trim()
    const website_url=(cols[1]||"").trim()
    await ctx.env.DB.prepare(
      `INSERT INTO import_rows (batch_id, status, brand_name, website_url, created_at)
       VALUES (?1, 'valid', ?2, ?3, datetime('now'))`
    ).bind(batchId, brand_name, website_url).run()
    inserted++
  }

  return new Response(JSON.stringify({ ok:true, id: batchId, rows: inserted }), { headers: { "content-type": "application/json" } })
}