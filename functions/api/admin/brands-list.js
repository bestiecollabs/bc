export async function onRequest() {
  return new Response(JSON.stringify({ ok:false, error:"not found: brands-list disabled" }), {
    status: 404,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0"
    }
  });
}
