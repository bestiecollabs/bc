export async function onRequest({ env, request }) {
  const json = { "content-type": "application/json; charset=utf-8" };

  // Cloudflare Access guard
  const h = request.headers;
  const ok =
    !!(h.get("CF-Access-Jwt-Assertion") ||
       h.get("Cf-Access-Jwt-Assertion") ||
       /(?:^|;\s*)CF_Authorization=/.test(h.get("Cookie") || ""));
  if (!ok) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: json });

  try {
    const url = new URL(request.url);

    if (request.method === "GET") {
      const info = await env.DB.prepare("PRAGMA table_info(users)").all();
      const names = new Set((info?.results || []).map(r => String(r.name).toLowerCase()));
      const has = (c) => names.has(String(c).toLowerCase());

      const sel: string[] = [];
      sel.push(has("id") ? "id" : "rowid AS id");
      sel.push(has("email") ? "email" : "NULL AS email");
      sel.push(has("username") ? "username" : "'' AS username");

      // account_type with admin precedence
      {
        const fallbackParts: string[] = [];
        if (has("account_type")) fallbackParts.push("NULLIF(account_type,'')");
        if (has("role"))         fallbackParts.push("NULLIF(role,'')");
        const fallback = fallbackParts.length ? `COALESCE(${fallbackParts.join(", ")}, 'user')` : `'user'`;
        const expr = has("is_admin")
          ? `CASE WHEN is_admin=1 THEN 'admin' ELSE ${fallback} END AS account_type`
          : `${fallback} AS account_type`;
        sel.push(expr);
      }

      // keep raw role for reference if present
      sel.push(has("role") ? "role" : "NULL AS role");
      sel.push(has("status") ? "status" : "'active' AS status");

      // derive suspended/deleted booleans
      sel.push(has("suspended") ? "suspended"
        : has("suspended_at") ? "CASE WHEN suspended_at IS NOT NULL THEN 1 ELSE 0 END AS suspended"
        : "0 AS suspended");

      sel.push(has("deleted") ? "deleted"
        : has("deleted_at") ? "CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END AS deleted"
        : "0 AS deleted");

      // created_at
      sel.push(has("created_at") ? "created_at"
        : has("createdon") ? "createdon AS created_at"
        : "NULL AS created_at");

      const orderCol = has("created_at") ? "created_at" : (has("id") ? "id" : "rowid");
      const rs = await env.DB.prepare(`SELECT ${sel.join(", ")} FROM users ORDER BY ${orderCol} DESC`).all();

      const items = (rs.results || []).map((u: any) => {
        const out = { ...u };
        if (typeof out.created_at === "number") {
          const ms = out.created_at < 1e12 ? out.created_at * 1000 : out.created_at;
          out.created_at = new Date(ms).toISOString();
        }
        return out;
      });

      return new Response(JSON.stringify({ ok: true, items, users: items }), { headers: json });
    }

    if (request.method === "DELETE") {
      const body = await request.json().catch(() => null);
      const id = url.searchParams.get("id") || body?.id;
      if (!id) return new Response(JSON.stringify({ error: "missing id" }), { status: 400, headers: json });
      const res = await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
      return new Response(JSON.stringify({ ok: true, changes: res.changes ?? 0 }), { headers: json });
    }

    return new Response("Method Not Allowed", { status: 405, headers: { "Allow": "GET, DELETE" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500, headers: json });
  }
}
