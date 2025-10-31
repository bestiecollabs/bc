type Row = { id: number; email: string; role: "brand"|"creator"|"admin"; created_at: number };

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
    // Map role -> account_type for the UI
    const items = (r.results ?? []).map(u => ({
      id: u.id,
      email: u.email,
      account_type: u.role,   // brand | creator | admin
      created_at: u.created_at,
    }));
    return json({ ok: true, count: items.length, items });
  }

  if (method === "POST") {
    const body = await safeJson(req) as any;
    const email = String(body?.email ?? "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: "invalid_email" }, 400);

    // Default new users to 'creator' unless you later add a selector
    const ins = await db.prepare("INSERT INTO users (email, role) VALUES (?1, 'creator')").bind(email).run();
    const id = Number(ins.meta?.last_row_id ?? 0);
    const row = await db.prepare("SELECT id, email, role, created_at FROM users WHERE id=?1").bind(id).first<Row>();
    return json({ ok: true, created: { id: row!.id, email: row!.email, account_type: row!.role, created_at: row!.created_at } }, 201);
  }

  if (method === "DELETE") {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id") ?? 0);
    if (!Number.isInteger(id) || id <= 0) return json({ ok: false, error: "invalid_id" }, 400);
    const del = await db.prepare("DELETE FROM users WHERE id=?1").bind(id).run();
    return json({ ok: true, deleted: Number(del.meta?.changes ?? 0) });
  }

  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, POST, DELETE" } });
};

async function safeJson(req: Request): Promise<unknown> { try { return await req.json(); } catch { return {}; } }
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
