type Row = { id: number; email: string; created_at: number };

export const onRequest: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const req = ctx.request;
  const access = req.headers.get("CF-Access-Jwt-Assertion");
  if (!access) return new Response("Unauthorized", { status: 401 });

  const method = req.method.toUpperCase();
  if (method === "GET") {
    const rows = await ctx.env.DB.prepare(
      "SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 200"
    ).all<Row>();
    return json({ ok: true, route: "/api/admin/users", count: rows.results.length, items: rows.results });
  }

  if (method === "POST") {
    const body = await safeJson(req);
    const email = String(body?.email ?? "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: "invalid_email" }, 400);

    // Create user with role=user and timestamps defaulted by schema
    const ins = await ctx.env.DB
      .prepare("INSERT INTO users (email, role) VALUES (?1, 'user')")
      .bind(email)
      .run();
    const id = Number(ins.meta?.last_row_id ?? 0);

    const row = await ctx.env.DB.prepare(
      "SELECT id, email, created_at FROM users WHERE id=?1"
    ).bind(id).first<Row>();

    return json({ ok: true, created: row }, 201);
  }

  if (method === "DELETE") {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id") ?? 0);
    if (!Number.isInteger(id) || id <= 0) return json({ ok: false, error: "invalid_id" }, 400);

    const del = await ctx.env.DB.prepare("DELETE FROM users WHERE id=?1").bind(id).run();
    const changed = Number(del.meta?.changes ?? 0);
    return json({ ok: true, deleted: changed });
  }

  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, POST, DELETE" } });
};

async function safeJson(req: Request): Promise<unknown> {
  try { return await req.json(); } catch { return {}; }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
