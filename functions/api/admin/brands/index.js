export const onRequestGet = async ({ env, request }) => {
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "50", 10)));
  const includeInactive = url.searchParams.get("include") === "inactive";

  async function tableExists(name){
    try{
      const row = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").bind(name).first();
      return !!(row && row.name);
    }catch(_){ return false; }
  }
  async function cols(name){
    const p = await env.DB.prepare(`PRAGMA table_info('${name}')`).all().catch(()=>({results:[]}));
    return (p.results||[]).map(c => (c.name||"").toString());
  }

  // Primary read from brands
  let rows = [];
  if(await tableExists("brands")){
    const c = await cols("brands");
    const has = (x) => c.includes(x);
    const selectCols = [];
    if(has("id")) selectCols.push("id");
    if(has("name")) selectCols.push("name");
    if(has("slug")) selectCols.push("slug");
    if(has("status")) selectCols.push("status");
    if(has("deleted")) selectCols.push("deleted");
    const sel = selectCols.length ? selectCols.join(",") : "*";
    const where = !includeInactive
      ? (has("deleted") ? "WHERE COALESCE(deleted,0)=0"
         : (has("status") ? "WHERE COALESCE(status,'published')='published'" : ""))
      : "";
    const sql = `SELECT ${sel} FROM brands ${where} ORDER BY id DESC LIMIT ?`;
    const rs = await env.DB.prepare(sql).bind(limit).all().catch(()=>({results:[]}));
    rows = (rs.results||[]).map(r => ({
      id: r.id ?? null,
      name: r.name ?? "",
      slug: r.slug ?? "",
      status: r.status ?? "published",
      deleted: !!(r.deleted ?? 0)
    }));
  }

  // Fallback to drafts if brands is empty
  if(!rows.length && await tableExists("brand_drafts")){
    const c = await cols("brand_drafts");
    const has = (x) => c.includes(x);
    const sel = has("id") ? "id, brand_name" : "brand_name";
    const sql = `SELECT ${sel} FROM brand_drafts ORDER BY ${has("id")?"id":"rowid"} DESC LIMIT ?`;
    const rs = await env.DB.prepare(sql).bind(limit).all().catch(()=>({results:[]}));
    rows = (rs.results||[]).map((r,i) => ({
      id: r.id ?? i+1,
      name: r.brand_name ?? "",
      slug: "",
      status: "draft",
      deleted: false
    }));
  }

  return new Response(JSON.stringify({ ok:true, rows }), { headers:{ "Content-Type":"application/json" }});
};

