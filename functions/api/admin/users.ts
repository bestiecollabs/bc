export async function onRequest({ env, request }) {
  const json = { "content-type": "application/json; charset=utf-8" };

  const h = request.headers;
  const ok = !!(h.get("CF-Access-Jwt-Assertion") || h.get("Cf-Access-Jwt-Assertion") || /(?:^|;\s*)CF_Authorization=/.test(h.get("Cookie") || ""));
  if (!ok) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: json });

  // helper to build stable select list (with admin precedence)
  async function selectList(env) {
    const info = await env.DB.prepare("PRAGMA table_info(users)").all();
    const names = new Set((info?.results || []).map(r => String(r.name).toLowerCase()));
    const has = (c) => names.has(String(c).toLowerCase());
    const sel = [];
    sel.push(has("id") ? "id" : "rowid AS id");
    sel.push(has("email") ? "email" : "NULL AS email");
    sel.push(has("username") ? "username" : "'' AS username");
    // account_type with admin precedence
    {
      const fall = [];
      if (has("account_type")) fall.push("NULLIF(account_type,'')");
      if (has("role"))         fall.push("NULLIF(role,'')");
      const fallback = fall.length ? `COALESCE(${fall.join(", ")}, 'user')` : `'user'`;
      const expr = has("is_admin")
        ? `CASE WHEN is_admin=1 THEN 'admin' ELSE ${fallback} END AS account_type`
        : `${fallback} AS account_type`;
      sel.push(expr);
    }
    sel.push(has("is_admin") ? "is_admin" : "0 AS is_admin");
    sel.push(has("role") ? "role" : "NULL AS role");
    sel.push(has("status") ? "status" : "'active' AS status");
    sel.push(has("suspended") ? "suspended" : (has("suspended_at") ? "CASE WHEN suspended_at IS NOT NULL THEN 1 ELSE 0 END AS suspended" : "0 AS suspended"));
    sel.push(has("deleted") ? "deleted" : (has("deleted_at") ? "CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END AS deleted" : "0 AS deleted"));
    sel.push(has("created_at") ? "created_at" : (has("createdon") ? "createdon AS created_at" : "NULL AS created_at"));
    const orderCol = has("created_at") ? "created_at" : (has("id") ? "id" : "rowid");
    return { sel: sel.join(", "), orderCol, has };
  }

  try {
    const url = new URL(request.url);

    if (request.method === "GET") {
      const { sel, orderCol } = await selectList(env);
      const rs = await env.DB.prepare(`SELECT ${sel} FROM users ORDER BY ${orderCol} DESC`).all();
      const items = (rs.results || []).map(u => {
        const out = { ...u };
        if (typeof out.created_at === "number") {
          const ms = out.created_at < 1e12 ? out.created_at * 1000 : out.created_at;
          out.created_at = new Date(ms).toISOString();
        }
        return out;
      });
      return new Response(JSON.stringify({ ok: true, items, users: items }), { headers: json });
    }

    if (request.method === "PATCH") {
      const body = await request.json().catch(() => null);
      const id = body?.id ?? url.searchParams.get("id");
      if (!id) return new Response(JSON.stringify({ error: "missing id" }), { status: 400, headers: json });

      const { has } = await selectList(env);
      const parts = [];
      const binds = [];

      if (has("is_admin") && typeof body?.is_admin !== "undefined") {
        parts.push("is_admin = ?");
        binds.push(body.is_admin ? 1 : 0);
      }

      if (typeof body?.suspend !== "undefined") {
        if (has("suspended_at")) parts.push(`suspended_at = ${body.suspend ? "unixepoch()" : "NULL"}`);
        if (has("status")) { parts.push("status = ?"); binds.push(body.suspend ? "suspended" : "active"); }
      }

      if (!parts.length) return new Response(JSON.stringify({ error: "no changes" }), { status: 400, headers: json });

      binds.push(id);
      await env.DB.prepare(`UPDATE users SET ${parts.join(", ")} WHERE id = ?`).bind(...binds).run();

      const { sel } = await selectList(env);
      const after = await env.DB.prepare(`SELECT ${sel} FROM users WHERE id = ?`).bind(id).all();
      const user = (after.results || [])[0] || null;
      return new Response(JSON.stringify({ ok: true, user }), { headers: json });
    }

    if (request.method === "DELETE") {
      const body = await request.json().catch(() => null);
      const id = url.searchParams.get("id") || body?.id;
      if (!id) return new Response(JSON.stringify({ error: "missing id" }), { status: 400, headers: json });
      const res = await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
      return new Response(JSON.stringify({ ok: true, changes: res.changes ?? 0 }), { headers: json });
    }

    return new Response("Method Not Allowed", { status: 405, headers: { "Allow": "GET, PATCH, DELETE" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500, headers: json });
  }
}
