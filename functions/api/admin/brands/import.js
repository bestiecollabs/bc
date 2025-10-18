/**
 * POST /api/admin/brands/import?dry=0
 * multipart/form-data, field "file"
 * New/updated rows -> status=in_review, is_public=0
 */
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestPost({ request, env }) {
  try {
    const url = new URL(request.url);
    const dry = url.searchParams.get("dry") === "1" ? true : false;
    const form = await request.formData();
    const file = form.get("file");
    if (!file || !file.text) return j({ ok:false, error:"missing_file" }, 400);

    const csv = await file.text();
    const rows = parseCsv(csv); // {header[], data[]}
    if (!rows.header.length) return j({ ok:false, error:"empty_csv" }, 400);

    // header mapping: accept many variants
    const map = headerMap(rows.header);

    let inserted = 0, updated = 0, skipped = 0, errors = [];

    if (!dry) {
      const stmt = `
        INSERT INTO brands (name, slug, domain, status, is_public, category_primary, category_secondary, category_tertiary, website_url, logo_url, created_at, updated_at)
        VALUES (?1, ?2, ?3, 'in_review', 0, ?4, ?5, ?6, ?7, ?8, datetime('now'), datetime('now'))
        ON CONFLICT(slug) DO UPDATE SET
          name=excluded.name,
          domain=excluded.domain,
          category_primary=excluded.category_primary,
          category_secondary=excluded.category_secondary,
          category_tertiary=excluded.category_tertiary,
          website_url=excluded.website_url,
          logo_url=excluded.logo_url,
          status='in_review',
          is_public=0,
          updated_at=datetime('now')
      `;
      const ps = await env.DB.prepare(stmt);

      for (const r of rows.data) {
        try {
          const nameRaw = pick(r, map.name);
          const domainRaw = pick(r, map.domain);
          const slugRaw = pick(r, map.slug);
          const name = (nameRaw||"").trim();
          let domain = (domainRaw||"").trim();
          if (!domain) {
            const urlGuess = pick(r, map.website_url);
            domain = guessDomain(urlGuess||"");
          } else {
            domain = guessDomain(domain);
          }
          if (!domain && name) domain = slugify(name) + ".com";

          let slug = (slugRaw||"").trim().toLowerCase() || (name ? slugify(name) : "");
          if (!slug && domain) slug = slugify(domain.replace(/^www\./i,"").replace(/\..*$/,""));

          if (!name || !slug || !domain) { skipped++; continue; }

          const website_url = (pick(r, map.website_url)||"").trim();
          const logo_url = (pick(r, map.logo_url)||"").trim();
          const cat1 = (pick(r, map.category_primary)||"").trim();
          const cat2 = (pick(r, map.category_secondary)||"").trim();
          const cat3 = (pick(r, map.category_tertiary)||"").trim();

          const res = await ps.bind(name, slug, domain, cat1, cat2, cat3, website_url, logo_url).run();
          if (res && res.meta) updated++; else inserted++;
        } catch (e) {
          errors.push({ row:r, error:String(e) });
        }
      }
    } else {
      for (const r of rows.data) {
        const name = (pick(r, ["name","brand","brand_name"])||"").trim();
        const domain = guessDomain(pick(r, ["domain","website","url","website_url"])||"");
        const slug = (pick(r, ["slug"])||"").trim() || (name ? slugify(name) : "");
        if (name && (domain||slug)) inserted++; else skipped++;
      }
    }

    return j({ ok:true, dry, inserted, updated, skipped, errors });
  } catch (err) {
    return j({ ok:false, error:String(err) }, 500);
  }
}

// ---------- helpers ----------
function j(obj, status=200){ return new Response(JSON.stringify(obj), { status, headers: { ...cors(), "content-type":"application/json; charset=utf-8" } }); }
function cors(){ return {
  "Access-Control-Allow-Origin":"https://bestiecollabs.com",
  "Access-Control-Allow-Methods":"GET,POST,PATCH,OPTIONS",
  "Access-Control-Allow-Headers":"content-type, x-admin-email"
};}
function parseCsv(text){
  const lines = text.replace(/\r\n/g,"\n").split("\n").filter(l=>l.trim().length);
  const header = lines[0].split(",").map(h=>h.trim());
  const data = [];
  for (let i=1;i<lines.length;i++){
    const cols = lines[i].split(",");
    const row = {};
    header.forEach((h,idx)=> row[h]= (cols[idx]||"").trim());
    data.push(row);
  }
  return { header, data };
}
function headerMap(header){
  const h = header.map(x=>x.toLowerCase());
  const idx = (names)=> names.map(n=> h.indexOf(n)).filter(i=>i>=0).map(i=> header[i]);
  return {
    name: idx(["name","brand","brand_name"]),
    domain: idx(["domain","shop_domain","store_domain","hostname","website","url","website_url"]),
    slug: idx(["slug","handle"]),
    website_url: idx(["website","url","website_url"]),
    logo_url: idx(["logo","logo_url","image","image_url"]),
    category_primary: idx(["category_primary","category","primary_category"]),
    category_secondary: idx(["category_secondary","secondary_category"]),
    category_tertiary: idx(["category_tertiary","tertiary_category"])
  };
}
function pick(row, keys){ if(!keys||!keys.length) return ""; for(const k of keys){ if(row[k]) return row[k]; } return ""; }
function slugify(s){ return String(s).toLowerCase().replace(/https?:\/\/(www\.)?/,"").replace(/[^\w]+/g,"-").replace(/^-+|-+$/g,""); }
function guessDomain(s){
  if(!s) return "";
  let t = String(s).trim();
  if (/^https?:\/\//i.test(t)===false) t = "https://" + t;
  try { const u = new URL(t); return (u.hostname||"").toLowerCase(); } catch { return t.toLowerCase(); }
}