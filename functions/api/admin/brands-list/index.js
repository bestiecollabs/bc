export async function onRequest() {
  return new Response(JSON.stringify({ ok:false, error:"not found: brands-list disabled v2" }), {
    status: 404,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}
