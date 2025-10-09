export async function onRequestGet({ env }) {
  try {
    const res = await env.DB.prepare("PRAGMA table_list;").all();
    // rows like: { schema, name, type, ncol, wr, strict }
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
