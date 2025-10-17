export const config = { runtime: "edge" };

interface Env { DB: D1Database }

function forbidden(msg: string) {
  return new Response(JSON.stringify({ ok: false, error: msg }), { status: 403, headers: { "content-type": "application/json" } });
}

function bad(msg: string) {
  return new Response(JSON.stringify({ ok: false, error: msg }), { status: 400, headers: { "content-type": "application/json" } });
}

export async function onRequestGet(ctx: { request: Request; env: Env }) {
  const admin = ctx.request.headers.get("x-admin-email") || "";
  if (admin.toLowerCase() !== "collabsbestie@gmail.com") return forbidden("admin header required");

  const url = new URL(ctx.request.url);
  const raw = url.searchParams.get("sql") || "";
  if (!raw) return bad("missing sql");

  // Only allow SELECT queries
  const illegal = /\b(insert|update|delete|drop|alter|create|attach|pragma|vacuum|replace|truncate)\b/i;
  if (illegal.test(raw)) return forbidden("only SELECT statements are allowed");

  const parts = raw.split(";").map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return bad("no statements found");

  const results: any[] = [];
  for (const stmt of parts) {
    if (!/^select\b/i.test(stmt)) return forbidden("only SELECT allowed");
    const q = ctx.env.DB.prepare(stmt);
    const rows = await q.all();
    results.push({ statement: stmt, result: rows });
  }
  return new Response(JSON.stringify({ ok: true, results }), { headers: { "content-type": "application/json" } });
}
