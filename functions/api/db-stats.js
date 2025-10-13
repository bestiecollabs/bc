export async function onRequestGet(ctx) {
  const { request, env } = ctx;
  const isAdmin = (req) => {
    const h = req.headers.get("x-admin-email");
    return h && /^(collabsbestie@gmail\.com|chipchip@bestiecollabs\.com)$/i.test(h);
  };
  if (!isAdmin(request)) return new Response("forbidden", { status: 403 });
  try {
    const q = (sql) => env.DB.prepare(sql).first();
    const res = {
      users:          await q("select count(*) as c from users"),
      brands_dir:     await q("select count(*) as c from directory_brands"),
      creators_dir:   await q("select count(*) as c from directory_creators"),
      invites:        await q("select count(*) as c from invites"),
      recycle_bin:    await q("select count(*) as c from admin_recycle_bin"),
      migrations_ver: await q("select max(id) as v from d1_migrations"),
    };
    return new Response(JSON.stringify({ ok: true, stats: res }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
