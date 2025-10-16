/**
 * POST /api/admin/import/brands/batches
 * Body: { mode: "dry-run" | "commit" }
 * Returns: { ok:true, id, mode }
 */
export async function onRequestPost({ request, env }) {
  // simple admin gate via header
  const email = String(request.headers.get("x-admin-email") || "").toLowerCase().trim();
  const allowed = (env?.ADMIN_ADMINS || "collabsbestie@gmail.com").split(",").map(s=>s.trim().toLowerCase());
  if (!email) return json({ ok:false, error:"missing_admin_email" }, 401);
  if (!allowed.includes(email)) return json({ ok:false, error:"not_allowed", email }, 401);

  let body = {};
  try { body = await request.json(); } catch (_) {}
  const mode = (body?.mode === "commit") ? "commit" : "dry-run";

  // generate a batch id (no persistence required for client flow)
  const id = (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8));

  return json({ ok:true, id, mode });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" }
  });
}