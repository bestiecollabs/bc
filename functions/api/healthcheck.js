export async function onRequest({ request }) {
  const url = new URL(request.url);
  return new Response(
    JSON.stringify({ ok: true, host: url.host, path: url.pathname }),
    { headers: { "content-type": "application/json" } }
  );
}
