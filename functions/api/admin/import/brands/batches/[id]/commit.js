export const config = { runtime: "edge" };

function json(o, s=200){ return new Response(JSON.stringify(o),{status:s,headers:{"content-type":"application/json"}}) }
function forbid(m){ return json({ok:false,error:m},403) }
function bad(m){ return json({ok:false,error:m},400) }
function slugify(s){ return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g,"").trim().replace(/\s+/g,"-").replace(/-+/g,"-") }
function hostFromUrl(u){ try { return new URL(u).hostname.toLowerCase() } catch { return "" } }

export async function onRequestPost(ctx){
  const admin = ctx.request.headers.get("x-admin-email")||"";
  if(admin.toLowerCase()!=="collabsbestie@gmail.com") return forbid("admin header required");

  const parts = new URL(ctx.request.url).pathname.split("/");
  const id = parts[parts.indexOf("batches")+1];
  if(!id) return bad("missing batch id");

  // Read valid rows for batch from import_rows(parsed_json, valid)
  const q = await ctx.env.DB.prepare(`
    SELECT row_num, parsed_json
    FROM import_rows
    WHERE batch_id = ?1 AND valid = 1
    ORDER BY row_num ASC
  `).bind(id).all();

  const rows = q.results || [];
  if(rows.length===0) return json({ ok:true, id:String(id), inserted:0, updated:0, skipped:0, committed:false });

  let inserted=0, updated=0, skipped=0;

  for(const r of rows){
    let obj;
    try { obj = JSON.parse(r.parsed_json||"{}") } catch { obj = {} }

    const name = (obj.name||"").trim();
    if(!name){ skipped++; continue; }

    const slug = (obj.slug||"").trim() || slugify(name);
    const website_url_raw = (obj.website_url||"").trim();
    const domain_raw = (obj.domain||"").trim() || hostFromUrl(website_url_raw);

    // Satisfy NOT NULLs in brands schema
    const website_url = website_url_raw || (domain_raw ? `https://${domain_raw}` : "");
    const category_primary = (obj.category_primary||"General").trim() || "General";

    // Upsert by slug into brands (deleted_at IS NULL)
    const existing = await ctx.env.DB.prepare(
      `SELECT id FROM brands WHERE slug = ?1 AND deleted_at IS NULL`
    ).bind(slug).all();

    if((existing.results||[]).length>0){
      const u = await ctx.env.DB.prepare(`
        UPDATE brands
        SET name = COALESCE(?1,name),
            website_url = COALESCE(?2,website_url),
            domain = COALESCE(?3,domain),
            category_primary = COALESCE(?4,category_primary),
            category_secondary = COALESCE(?5,category_secondary),
            category_tertiary = COALESCE(?6,category_tertiary),
            instagram_url = COALESCE(?7,instagram_url),
            tiktok_url = COALESCE(?8,tiktok_url),
            logo_url = COALESCE(?9,logo_url),
            description = COALESCE(?10,description),
            contact_email = COALESCE(?11,contact_email),
            import_batch_id = ?12,
            updated_at = datetime('now')
        WHERE slug = ?13 AND deleted_at IS NULL
      `).bind(
        name||null, website_url||null, domain_raw||null,
        category_primary||null, (obj.category_secondary||null), (obj.category_tertiary||null),
        (obj.instagram_url||null), (obj.tiktok_url||null), (obj.logo_url||null), (obj.description||null),
        (obj.contact_email||null),
        "brands_"+id, slug
      ).run();
      if((u.meta?.changes||0)>0) updated++;
      continue;
    }

    const ins = await ctx.env.DB.prepare(`
      INSERT INTO brands (
        name, slug, domain, website_url,
        category_primary, category_secondary, category_tertiary,
        instagram_url, tiktok_url, logo_url, description,
        contact_email, status, import_batch_id, created_at, updated_at
      ) VALUES (
        ?1, ?2, ?3, ?4,
        ?5, ?6, ?7,
        ?8, ?9, ?10, ?11,
        ?12, 'draft', ?13, datetime('now'), datetime('now')
      )
    `).bind(
      name, slug, domain_raw||null, website_url,
      category_primary, (obj.category_secondary||null), (obj.category_tertiary||null),
      (obj.instagram_url||null), (obj.tiktok_url||null), (obj.logo_url||null), (obj.description||null),
      (obj.contact_email||null), "brands_"+id
    ).run();
    if((ins.meta?.changes||0)>0) inserted++;
  }

  if(inserted+updated>0){
    await ctx.env.DB.prepare(`UPDATE import_batches SET status='committed' WHERE id=?1`).bind(id).run();
  }

  return json({ ok:true, id:String(id), inserted, updated, skipped, committed:(inserted+updated)>0 });
}