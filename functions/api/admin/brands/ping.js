export const onRequestGet = () => new Response(JSON.stringify({ ok:true, route:"/api/admin/brands/ping" }), { headers:{ "content-type":"application/json" }});
