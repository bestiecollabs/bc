export async function onRequestGet(ctx) {
  const { request, env } = ctx;
  const isAdmin = (req) => {
    const h = req.headers.get("x-admin-email");
    return h && /^(collabsbestie@gmail\.com|chipchip@bestiecollabs\.com)$/i.test(h);
  };
  if (!isAdmin(request)) return new Response("forbidden", { status: 403 });
  try {
    const res = await env.DB.prepare("PRAGMA table_list;").all();
    const tables = (res?.results || []).map(r => ({ name: r.name, type: r.type, ncol: r.ncol }));
    return new Response(JSON.stringify({ ok: true, tables }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
