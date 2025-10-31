export async function onRequestGet({ env, request }) {
  // Accept Cloudflare Access header or cookie
  const h = request.headers;
  const ok = !!(h.get("CF-Access-Jwt-Assertion") || h.get("Cf-Access-Jwt-Assertion") || /(?:^|;\s*)CF_Authorization=/.test(h.get("Cookie") || ""));
  if (!ok) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json; charset=utf-8" } });
  }

  const sqlWithStatus = `
    SELECT id, email, username, role, status, created_at
    FROM users
    ORDER BY created_at DESC
  `;
  const sqlFallback = `
    SELECT id, email, username, role, created_at, 'active' AS status
    FROM users
    ORDER BY created_at DESC
  `;

  try {
    try {
      const { results } = await env.DB.prepare(sqlWithStatus).all();
      return new Response(JSON.stringify({ users: results ?? [] }), { headers: { "content-type": "application/json; charset=utf-8" } });
    } catch (e) {
      const { results } = await env.DB.prepare(sqlFallback).all();
      return new Response(JSON.stringify({ users: results ?? [], note: "status column missing; defaulted to 'active'" }), { headers: { "content-type": "application/json; charset=utf-8" } });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "content-type": "application/json; charset=utf-8" } });
  }
}
