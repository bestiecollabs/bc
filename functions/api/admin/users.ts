export async function onRequest({ env, request }) {
  const json = { "content-type": "application/json; charset=utf-8" };

  // Cloudflare Access
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
      const info = await env.DB.prepare("PRAGMA table_info(users)").all();
      const names = new Set((info?.results || []).map(r => String(r.name).toLowerCase()));
      const has = (c) => names.has(String(c).toLowerCase());

      // Select list with robust fallbacks so the frontend always gets the same keys
      const parts = [];
      parts.push(has("id") ? "id" : "rowid AS id");
      parts.push(has("email") ? "email" : "NULL AS email");
      parts.push(has("username") ? "username" : "'' AS username");

      if (has("account_type")) parts.push("account_type");
      else if (has("role"))    parts.push("role AS account_type");
      else if (has("is_admin"))parts.push("CASE WHEN is_admin=1 THEN 'admin' ELSE 'user' END AS account_type");
      else                     parts.push("'user' AS account_type");

      parts.push(has("status") ? "status" : "'active' AS status");
      parts.push(has("role") ? "role" : "NULL AS role");
      parts.push(has("suspended") ? "suspended" : "0 AS suspended");
      parts.push(has("deleted")   ? "deleted"   : "0 AS deleted");
      parts.push(
        has("created_at") ? "created_at"
        : (has("createdon") ? "createdon AS created_at" : "NULL AS created_at")
      );

      const selectList = parts.join(", ");
      const orderCol = has("created_at") ? "created_at" : (has("id") ? "id" : "rowid");

      const rs = await env.DB.prepare(`SELECT ${selectList} FROM users ORDER BY ${orderCol} DESC`).all();
      const items = rs.results || [];
      return new Response(JSON.stringify({ ok: true, items, users: items }), { headers: json });
    }

    if (request.method === "DELETE") {
      const body = await request.json().catch(() => null);
      const id = new URL(request.url).searchParams.get("id") || body?.id;
      if (!id) return new Response(JSON.stringify({ error: "missing id" }), { status: 400, headers: json });
      const res = await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
      return new Response(JSON.stringify({ ok: true, changes: res.changes ?? 0 }), { headers: json });
    }

    return new Response("Method Not Allowed", { status: 405, headers: { "Allow": "GET, DELETE" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500, headers: json });
  }
}
