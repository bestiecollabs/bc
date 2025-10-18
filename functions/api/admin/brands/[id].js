/**
 * PATCH /api/admin/brands/{id}
 * Body:
 *   { "restore": true }           -> deleted_at = NULL
 *   { "status": "published" }     -> updates status
 *   { "is_public": 1 }            -> updates is_public (1|0)
 * Admin header required: x-admin-email in ADMIN_ADMINS
 * Response: { ok, item }
 */
export async function onRequestPatch({ env, request, params }) {
  const admin = String(request.headers.get("x-admin-email") || "").trim().toLowerCase();
  const allow = String(env.ADMIN_ADMINS || "collabsbestie@gmail.com").toLowerCase().split(",").map(s => s.trim());
  if (!admin || !allow.includes(admin)) return J({ ok:false, error:"not_allowed" }, 401);

  const id = parseInt(String(params?.id || ""), 10);
  if (!Number.isFinite(id)) return J({ ok:false, error:"invalid_id" }, 400);

  let body = {};
  try { body = await request.json(); } catch { body = {}; }

  const has = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='brands'").first();
  if (!has) return J({ ok:false, error:"table_missing" }, 500);

  const sets = [];
  const binds = [];

  if (body.restore === true) sets.push("deleted_at = NULL");

  if (typeof body.status === "string") {
    const s = body.status.trim().toLowerCase();
    const allowed = new Set(["in_review","published","draft","archived"]);
    if (!allowed.has(s)) return J({ ok:false, error:"invalid_status" }, 400);
    sets.push("status = ?");
    binds.push(s);
  }

  if (body.is_public !== undefined) {
    const v = (body.is_public === 1 || body.is_public === true) ? 1
          : (body.is_public === 0 || body.is_public === false) ? 0
          : null;
    if (v === null) return J({ ok:false, error:"invalid_is_public" }, 400);
    sets.push("is_public = ?");
    binds.push(v);
  }

  if (sets.length === 0) return J({ ok:false, error:"no_changes" }, 400);

  sets.push("updated_at = CURRENT_TIMESTAMP");
  const sql = `UPDATE brands SET ${sets.join(", ")} WHERE id = ?`;
  const res = await env.DB.prepare(sql).bind(...binds, id).run().catch(() => null);
  if (!res || res.success !== true) return J({ ok:false, error:"update_failed" }, 500);

  const item = await env.DB.prepare(
    "SELECT id, name, slug, status, is_public, logo_url, website_url, updated_at, deleted_at FROM brands WHERE id = ?"
  ).bind(id).first();

  return J({ ok:true, item });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, PATCH, OPTIONS",
      "access-control-allow-headers": "content-type, x-admin-email",
      "content-type": "text/plain; charset=utf-8"
    }
  });
}

function J(body, status=200){
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, PATCH, OPTIONS",
      "access-control-allow-headers": "content-type, x-admin-email"
    }
  });
}