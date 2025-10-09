export async function onRequestGet({ env }) {
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
