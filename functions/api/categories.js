/**
 * GET /api/categories -> { ok, categories: [] }
 */
export const onRequestGet = async ({ env }) => {
  const row = await env.DB.prepare("SELECT value FROM config WHERE key='allowed_categories'").first();
  const categories = row?.value ? JSON.parse(row.value) : [];
  return new Response(JSON.stringify({ ok:true, categories }), { headers:{ "content-type":"application/json" }});
};
