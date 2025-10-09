export async function onRequestGet(ctx) {
  const { request, env } = ctx;
  const isAdmin = (req) => {
    const h = req.headers.get("x-admin-email");
    return h && /^(collabsbestie@gmail\.com|chipchip@bestiecollabs\.com)$/i.test(h);
  };
  if (!isAdmin(request)) return new Response("forbidden", { status: 403 });
  try {
    const row = await env.DB.prepare("select 1 as ok").first();
    const dbOk = !!(row && row.ok === 1);
    return new Response(JSON.stringify({ ok: true, db: dbOk }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
