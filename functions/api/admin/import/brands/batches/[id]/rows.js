export async function onRequestGet({ env, params, request }) {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(200, parseInt(url.searchParams.get("limit") || "100", 10)));
  const offset = (page - 1) * limit;
  const batchId = Number(params.id);
  const total = await env.DB.prepare("SELECT COUNT(*) AS c FROM import_rows WHERE batch_id=?").bind(batchId).first();
  const rs = await env.DB.prepare(
    "SELECT id,row_num,parsed_json,errors_json,valid FROM import_rows WHERE batch_id=? ORDER BY row_num LIMIT ? OFFSET ?"
  ).bind(batchId, limit, offset).all();
  return new Response(JSON.stringify({ ok:true, page, limit, total: total.c, items: rs.results }), { headers:{ "Content-Type":"application/json" }});
}
