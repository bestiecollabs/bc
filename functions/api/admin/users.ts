type Row = { id: number; email: string; role: "brand" | "creator"; created_at: number };

export const onRequest: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const req = ctx.request;

  // Access via header or CF Access cookie
  let access = req.headers.get("CF-Access-Jwt-Assertion");
  if (!access) {
    const m = /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(req.headers.get("Cookie") || "");
    if (m) access = m[1];
  }
  if (!access) return new Response("Unauthorized", { status: 401 });

  const db = ctx.env.DB;
  const method = req.method.toUpperCase();

  if (method === "GET") {
    const r = await db.prepare(
      "SELECT id, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 200"
    ).all<Row>();
    return json({ ok: true, count: r.results.length, items: r.results });
  }

  if (method === "POST") {
    const body = await safeJson(req) as any;
    const email = String(body?.email ?? "").trim().toLowerCase();
    const role = (String(body?.role ?? "creator").toLowerCase() as "brand"|"creator");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: "invalid_email" }, 400);
    if (!["brand","creator"].includes(role)) return json({ ok: false, error: "invalid_role" }, 400);

    const ins = await db.prepare("INSERT INTO users (email, role) VALUES (?1, ?2)").bind(email, role).run();
    const id = Number(ins.meta?.last_row_id ?? 0);
    const row = await db.prepare("SELECT id, email, role, created_at FROM users WHERE id=?1").bind(id).first<Row>();
    return json({ ok: true, created: row }, 201);
  }

  if (method === "PATCH") {
    const body = await safeJson(req) as any;
    const id = Number(body?.id ?? 0);
    const role = (String(body?.role ?? "").toLowerCase() as "brand"|"creator");
    if (!Number.isInteger(id) || id <= 0) return json({ ok: false, error: "invalid_id" }, 400);
    if (!["brand","creator"].includes(role)) return json({ ok: false, error: "invalid_role" }, 400);

    const up = await db.prepare("UPDATE users SET role=?1, updated_at=unixepoch() WHERE id=?2").bind(role, id).run();
    if (Number(up.meta?.changes ?? 0) === 0) return json({ ok: false, error: "not_found" }, 404);
    const row = await db.prepare("SELECT id, email, role, created_at FROM users WHERE id=?1").bind(id).first<Row>();
    return json({ ok: true, updated: row });
  }

  if (method === "DELETE") {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id") ?? 0);
    if (!Number.isInteger(id) || id <= 0) return json({ ok: false, error: "invalid_id" }, 400);
    const del = await db.prepare("DELETE FROM users WHERE id=?1").bind(id).run();
    return json({ ok: true, deleted: Number(del.meta?.changes ?? 0) });
  }

  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, POST, PATCH, DELETE" } });
};

async function safeJson(req: Request): Promise<unknown> { try { return await req.json(); } catch { return {}; } }
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
