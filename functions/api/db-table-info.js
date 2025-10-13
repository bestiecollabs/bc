export async function onRequestGet(ctx) {
  const { request, env } = ctx;
  const isAdmin = (req) => {
    const h = req.headers.get("x-admin-email");
    return h && /^(collabsbestie@gmail\.com|chipchip@bestiecollabs\.com)$/i.test(h);
  };
  if (!isAdmin(request)) return new Response("forbidden", { status: 403 });

  const url = new URL(request.url);
  const name = url.searchParams.get("name");
  if (!name) return new Response(JSON.stringify({ ok:false, error:"missing name"}), { status: 400 });

  try {
    const cols = await env.DB.prepare(`PRAGMA table_info(${name});`).all();
    const idx  = await env.DB.prepare(`PRAGMA index_list(${name});`).all();
    return new Response(JSON.stringify({
      ok: true,
      table: name,
      columns: cols?.results || [],
      indexes: idx?.results || []
    }), { headers: { "content-type": "application/json" }});
  } catch (err) {
    return new Response(JSON.stringify({ ok:false, error:String(err) }), {
      status: 500, headers: { "content-type": "application/json" }
    });
  }
}
