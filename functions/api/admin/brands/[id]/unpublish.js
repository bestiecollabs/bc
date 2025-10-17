/** POST /api/admin/brands/:id/unpublish
 * Sets status='draft' for an existing, not-soft-deleted brand.
 */
export async function onRequestPost({ request, env, params }) {
  const admin = request.headers.get("x-admin-email") || "";
  if (!admin) return json({ ok:false, error:"unauthorized" }, 401);

  const id = Number(params.id);
  if (!Number.isInteger(id)) return json({ ok:false, error:"bad_id" }, 400);

  try{
    const row = await env.DB.prepare("SELECT id FROM brands WHERE id=? AND deleted_at IS NULL").bind(id).first();
    if (!row) return json({ ok:false, error:"not_found" }, 404);

    await env.DB.prepare("UPDATE brands SET status='draft', updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(id).run();
    const out = await env.DB.prepare("SELECT id,name,status FROM brands WHERE id=?").bind(id).first();
    return json({ ok:true, brand: out });
  }catch(e){
    return json({ ok:false, error:"db_error" }, 500);
  }
}
function json(b,s=200){ return new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json'}}); }