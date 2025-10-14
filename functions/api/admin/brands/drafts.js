export async function onRequestGet({ env }) {
  const rs = await env.DB.prepare(`SELECT id, source_row_id, data_json, issues_json, created_at FROM brand_drafts ORDER BY id DESC LIMIT 200`).all();
  return new Response(JSON.stringify({ ok:true, items: rs.results }), { headers:{ "Content-Type":"application/json"}});
}
