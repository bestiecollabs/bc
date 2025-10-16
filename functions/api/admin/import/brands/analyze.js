/** Placeholder to keep build green. */
export async function onRequestPost({ request }) {
  const body = await request.text();
  return new Response(JSON.stringify({
    ok: true,
    bytes: body.length,
    message: "analyze endpoint placeholder"
  }), { headers: { "Content-Type": "application/json" }});
}
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type"
  }});
}