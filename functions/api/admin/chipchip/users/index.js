import { assertAdmin, json, notFound, q, csvResponse, run as runMaybe } from "../_lib/db.js";

export async function onRequest({ env, request }) {
  const email = assertAdmin(env, request);
  if (!email) return notFound();

  const url = new URL(request.url);
  if (request.method === "GET") {
    const search = (url.searchParams.get("search") || "").toLowerCase();
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 500);
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);
    const sort = url.searchParams.get("sort") || "email";
    const dir = (url.searchParams.get("dir") || "asc").toUpperCase() === "DESC" ? "DESC" : "ASC";
    const exportAll = url.searchParams.get("export") === "all";

    const base =
      `SELECT u.id, u.email, u.username, u.full_name, u.role, u.phone,
              m.bestie_score, m.last_login_at, m.suspended_at,
              u.shop_name, u.is_shopify_store, u.tiktok_user_id, u.instagram_user_id
         FROM users u
         LEFT JOIN users_admin_meta m ON m.user_id = u.id`;

    const where = search
      ? ` WHERE LOWER(u.email) LIKE ? OR LOWER(u.username) LIKE ? OR LOWER(u.full_name) LIKE ?`
      : ``;

    const orderCol = ["email","username","full_name","role","last_login_at","bestie_score"].includes(sort)
      ? (sort === "last_login_at" ? "m.last_login_at" : sort === "bestie_score" ? "m.bestie_score" : `u.${sort}`)
      : "u.email";
    const order = ` ORDER BY ${orderCol} ${dir}`;

    if (exportAll) {
      const rows = await q(env.DB, base + where + order, search ? [`%${search}%`,`%${search}%`,`%${search}%`] : []);
      const header = ["id","email","username","full_name","role","phone","shop_name","is_shopify_store","tiktok_user_id","instagram_user_id","last_login_at","bestie_score","suspended_at"];
      const out = rows.results.map(r => header.map(h => r[h]));
      return csvResponse("users_export.csv", header, out);
    }

    const count = await q(env.DB, `SELECT COUNT(1) as c FROM users u` + (where ? where : ""), search ? [`%${search}%`,`%${search}%`,`%${search}%`] : []);
    const rows = await q(env.DB, base + where + order + ` LIMIT ? OFFSET ?`,
      search ? [`%${search}%`,`%${search}%`,`%${search}%`, limit, offset] : [limit, offset]);

    return json({ total: count.results[0]?.c || 0, rows: rows.results });
  }

  if (request.method === "POST") {
    const body = await request.json();
    const { action, ids = [] } = body || {};
    if (!Array.isArray(ids) || ids.length === 0) return json({ error: "ids required" }, 400);

    const ts = Math.floor(Date.now()/1000);
    const batch = crypto.randomUUID?.() || String(ts);

    if (action === "suspend" || action === "unsuspend") {
      for (const id of ids) {
        const before = await q(env.DB, `SELECT * FROM users_admin_meta WHERE user_id=?`, [id]);
        const now = ts;
        if (action === "suspend") {
          await runMaybe(env.DB, `INSERT INTO users_admin_meta(user_id, suspended_at) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET suspended_at=excluded.suspended_at`, [id, now]);
        } else {
          await runMaybe(env.DB, `INSERT INTO users_admin_meta(user_id, suspended_at) VALUES(?,NULL) ON CONFLICT(user_id) DO UPDATE SET suspended_at=NULL`, [id]);
        }
        await audit(env, email, action, "users_admin_meta", id, before.results?.[0] || null, { user_id:id, suspended_at: action==="suspend" ? now : null }, batch, ts);
      }
      return json({ ok: true, batch_id: batch, count: ids.length });
    }

    if (action === "delete") {
      for (const id of ids) {
        const row = await q(env.DB, `SELECT * FROM users WHERE id=?`, [id]);
        if (row.results?.length) {
          await runMaybe(env.DB, `INSERT INTO admin_recycle_bin(id, entity_table, entity_id, before_json, batch_id, created_at)
                                  VALUES(?,?,?,?,?,?)`,
            [crypto.randomUUID?.() || String(ts), "users", id, JSON.stringify(row.results[0]), batch, ts]);
          await runMaybe(env.DB, `DELETE FROM users WHERE id=?`, [id]);
          await audit(env, email, "delete", "users", id, row.results[0], null, batch, ts);
        }
      }
      return json({ ok: true, batch_id: batch, count: ids.length });
    }

    return json({ error: "unsupported action" }, 400);
  }

  return notFound();
}

async function audit(env, actor, action, table, id, before, after, batch, ts) {
  await (await import("../_lib/db.js")).run(env.DB,
    `INSERT INTO admin_audit(id, actor_email, action, entity_table, entity_id, before_json, after_json, batch_id, created_at)
     VALUES(?,?,?,?,?,?,?,?,?)`,
    [crypto.randomUUID?.() || String(ts), actor, action, table, id, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null, batch, ts]
  );
}
