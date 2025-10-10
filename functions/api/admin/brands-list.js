export const onRequestGet = () => new Response(JSON.stringify({ ok:true, route:"/api/admin/brands-list" }), { headers:{ "content-type":"application/json" }});
