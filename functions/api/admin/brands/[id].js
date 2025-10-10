export const onRequest = async ({ request, env, params }) => {
  const admin = request.headers.get("x-admin-email");
  if (!admin) return json({ ok:false, error:"unauthorized" }, 401);
  if (request.method !== "PATCH") return json({ ok:false, error:"method_not_allowed" }, 405);

  const id = Number(params.id);
  if (!Number.isInteger(id)) return json({ ok:false, error:"bad_id" }, 400);

  const body = await request.json().catch(()=>null);
  if (!body) return json({ ok:false, error:"bad_body" }, 400);

  const fields = {
    name:'TEXT', category_primary:'TEXT', category_secondary:'TEXT', category_tertiary:'TEXT',
    instagram_url:'TEXT', tiktok_url:'TEXT', shopify_shop_domain:'TEXT',
    description:'TEXT', contact_email:'TEXT', logo_url:'TEXT',
    status:'TEXT', featured:'INT'
  };

  const sets = [], binds = [];
  for (const k of Object.keys(fields)) {
    if (k in body) {
      sets.push(`${k}=?`);
      if (k === 'featured') binds.push(body[k]?1:0);
      else if (k === 'status') binds.push(String(body[k]).toLowerCase());
      else binds.push(body[k]);
    }
  }
  if (sets.length === 0) return json({ ok:false, error:"no_fields" }, 400);

  const now = new Date().toISOString();
  sets.push(`updated_at='${now}'`);

  const sql = `UPDATE brands SET ${sets.join(', ')} WHERE id=?`;
  const res = await env.DB.prepare(sql).bind(...binds, id).run();
  const row = await env.DB.prepare(`SELECT id,name,status,featured FROM brands WHERE id=?`).bind(id).first();
  return json({ ok:true, meta: res?.meta ?? res, brand: row });
};
function json(b,s=200){ return new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json'}}); }
