export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  const isAdmin = (req) => {
    const h = req.headers.get("x-admin-email");
    return h && /^(collabsbestie@gmail\.com|chipchip@bestiecollabs\.com)$/i.test(h);
  };
  if (!isAdmin(request)) return new Response("forbidden", { status: 403 });

  const body = await request.json().catch(() => ({}));
  const sql = (body && body.sql || "").trim();

  // Read-only guard: allow only SELECT and PRAGMA
  if (!/^(select|pragma)\b/i.test(sql)) {
    return new Response(JSON.stringify({ ok:false, error:"read-only endpoint" }), { status: 400 });
  }

  try {
    const stmt = env.DB.prepare(sql);
    const res = /pragma/i.test(sql) ? await stmt.all() : await stmt.all();
    return new Response(JSON.stringify({ ok:true, results: res?.results ?? [] }), {
      headers: { "content-type":"application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok:false, error:String(err) }), {
      status: 500, headers: { "content-type":"application/json" }
    });
  }
}
