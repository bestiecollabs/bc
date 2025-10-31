export async function onRequest({ env, request }) {
  const json = { "content-type": "application/json; charset=utf-8" };

  // Cloudflare Access: header or cookie
  const h = request.headers;
  const hasAccess =
    !!(h.get("CF-Access-Jwt-Assertion") ||
       h.get("Cf-Access-Jwt-Assertion") ||
       /(?:^|;\\s*)CF_Authorization=/.test(h.get("Cookie") || ""));
  if (!hasAccess) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: json });
  }

  try {
    const url = new URL(request.url);

    if (request.method === "GET") {
      // Introspect columns to avoid "no such column" errors
      const info = await env.DB.prepare("PRAGMA table_info(users)").all();
      const cols = (info?.results || []).map(r => r.name);
      const pick = ["id","email","username","status","role","is_admin","created_at","updated_at"].filter(c => cols.includes(c));
      const selectList = pick.length ? pick.join(",") : "rowid as id, email";
      const orderCol = pick.includes("created_at") ? "created_at" : (pick.includes("id") ? "id" : "rowid");

      const rs = await env.DB.prepare(`SELECT ${selectList} FROM users ORDER BY ${orderCol} DESC`).all();
      return new Response(JSON.stringify({ ok: true, users: rs.results || [] }), { headers: json });
    }

    if (request.method === "DELETE") {
      // Support ?id=... or JSON body { id }
      const body = await request.json().catch(() => null);
      const id = url.searchParams.get("id") || body?.id;
      if (!id) {
        return new Response(JSON.stringify({ error: "missing id" }), { status: 400, headers: json });
      }
      const res = await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
      return new Response(JSON.stringify({ ok: true, changes: res.changes ?? 0 }), { headers: json });
    }

    return new Response("Method Not Allowed", { status: 405, headers: { "Allow": "GET, DELETE" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500, headers: json });
  }
}
