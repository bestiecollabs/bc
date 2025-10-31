export const onRequestGet: PagesFunction = async ({ request }) => {
  const h = request.headers;
  const jwt =
    h.get("CF-Access-Jwt-Assertion") ||
    h.get("Cf-Access-Jwt-Assertion") ||
    (h.get("Cookie") || "").match(/(?:^|;\s*)CF_Authorization=([^;]+)/)?.[1] ||
    "";
  const ok = !!jwt;
  return new Response(JSON.stringify({ ok, hasJwt: ok }), {
    status: ok ? 200 : 401,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
};
