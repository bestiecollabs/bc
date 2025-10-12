export async function onRequest() {
  return new Response(JSON.stringify({ ok: false, error: "not found" }), {
    status: 404,
    headers: { "content-type": "application/json" }
  });
}
