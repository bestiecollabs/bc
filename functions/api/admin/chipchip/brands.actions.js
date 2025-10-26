import { assertAdmin, json, notFound, ulid, nowSec, getByIds } from "./_lib/db.js";
async function parseJSON(req) {
  try {
    const copy = req.clone();
    return await copy.json();
  } catch {
    return {};
  }
}

export async function onRequest({ env, request }) {
  try {
    const email = assertAdmin(env, request);
    if (!email) return notFound();
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const body = await parseJSON(request);
    const action = String(body.action || "delete").toLowerCase();
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
    if (!ids.length) return json({ ok: false, error: "ids required" }, 400);
    if (!["delete", "hard_delete"].includes(action)) {
      return json({ ok: false, error: "action must be delete|hard_delete" }, 400);
    }

    const table = "directory_brands";
    const batchId = ulid();
    const ts = nowSec();

    // Fetch rows before mutation
    const list = await getByIds(env.DB, table, ids);
    if (!list.length) return json({ ok: false, error: "no matching ids" }, 404);

    const qMarks = ids.map(() => "?").join(",");
    const stmts = [];

    if (action === "delete") {
      // Soft delete via recycle bin
      for (const r of list) {
        const before = JSON.stringify(r);
        stmts.push(
          env.DB.prepare(
            `INSERT INTO admin_recycle_bin (id, admin_email, action, entity_table, entity_id, before_json, after_json, batch_id, created_at, ts)
             VALUES (?,?,?,?,?,?,NULL,?,?,?)`
          ).bind(ulid(), email, action, table, r.id, before, batchId, ts, ts)
        );
      }
    }

    // Execute deletion from source table
    stmts.push(env.DB.prepare(`DELETE FROM ${table} WHERE id IN (${qMarks})`).bind(...ids));

    await env.DB.batch(stmts);
    return json({ ok: true, batch_id: batchId, deleted: list.length, action });
  } catch (e) {
    const msg = (e && (e.stack || e.message)) ? String(e.stack || e.message) : String(e);
    return json({ ok: false, error: msg }, 500);
  }
}