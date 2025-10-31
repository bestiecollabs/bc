export async function onRequest({ env, request }) {
  const json = { "content-type": "application/json; charset=utf-8" };

  // Cloudflare Access
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

      const sel = [];
      sel.push(has("id") ? "id" : "rowid AS id");
      sel.push(has("email") ? "email" : "NULL AS email");
      sel.push(has("username") ? "username" : "'' AS username");

      if (has("account_type")) sel.push("account_type");
      else if (has("role"))    sel.push("role AS account_type");
      else if (has("is_admin"))sel.push("CASE WHEN is_admin=1 THEN 'admin' ELSE 'user' END AS account_type");
      else                     sel.push("'user' AS account_type");

      sel.push(has("role") ? "role" : "NULL AS role");
      sel.push(has("status") ? "status" : "'active' AS status");

      // derive booleans for UI from *_at timestamps if needed
      if (has("suspended"))        sel.push("suspended");
      else if (has("suspended_at"))sel.push("CASE WHEN suspended_at IS NOT NULL THEN 1 ELSE 0 END AS suspended");
      else                         sel.push("0 AS suspended");

      if (has("deleted"))          sel.push("deleted");
      else if (has("deleted_at"))  sel.push("CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END AS deleted");
      else                         sel.push("0 AS deleted");

      // created_at fallback
      if (has("created_at"))       sel.push("created_at");
      else if (has("createdon"))   sel.push("createdon AS created_at");
      else                         sel.push("NULL AS created_at");

      const orderCol = has("created_at") ? "created_at" : (has("id") ? "id" : "rowid");
      const q = `SELECT ${sel.join(", ")} FROM users ORDER BY ${orderCol} DESC`;
      const rs = await env.DB.prepare(q).all();
      const items = (rs.results || []).map(u => {
        const out = { ...u };
        // normalize created_at to ISO string for the UI
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
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500, headers: json });
  }
}
