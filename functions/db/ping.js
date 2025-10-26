export async function onRequestGet({ env }) {
  const r = await env.DB.prepare("SELECT count(*) AS c FROM creators").first();
  return new Response(JSON.stringify({ ok:true, count: r?.c ?? 0 }, null, 2),
    { headers:{ "content-type":"application/json" }});
}
