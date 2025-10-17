export const config = { runtime: "edge" };
interface Env { DB: D1Database }
const json = (obj: any, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
const forbidden = (m: string) => json({ ok: false, error: m }, 403);
const bad = (m: string) => json({ ok: false, error: m }, 400);

export async function onRequestGet(ctx: { request: Request; env: Env }) {
  try {
    const admin = ctx.request.headers.get("x-admin-email") || "";
    if (admin.toLowerCase() !== "collabsbestie@gmail.com") return forbidden("admin header required");

    const url = new URL(ctx.request.url);
    const raw = url.searchParams.get("sql") || "";
    if (!raw) return bad("missing sql");

    // Only allow SELECT
    const illegal = /\b(insert|update|delete|drop|alter|create|attach|pragma|vacuum|replace|truncate)\b/i;
    if (illegal.test(raw)) return forbidden("only SELECT statements are allowed");

    const parts = raw.split(";").map(s => s.trim()).filter(Boolean);
    if (parts.length === 0) return bad("no statements found");

    const out: any[] = [];
    for (const stmt of parts) {
      if (!/^select\b/i.test(stmt)) return forbidden("only SELECT allowed");
      try {
        const res = await ctx.env.DB.prepare(stmt).all();
        out.push({ statement: stmt, result: res });
      } catch (e: any) {
        // Surface exact D1 error so we can debug (code/message)
        out.push({
          statement: stmt,
          error: true,
          message: String(e?.message || e),
          name: String(e?.name || "Error"),
          cause: e?.cause ?? null
        });
      }
    }
    return json({ ok: true, results: out });
  } catch (e: any) {
    return json({ ok: false, fatal: true, message: String(e?.message || e) }, 500);
  }
}
