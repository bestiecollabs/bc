/**
 * POST /api/admin/import/brands/batches
 * Body: { mode: "dry-run" | "commit" }
 * Returns: { ok:true, id, mode }
 */
export async function onRequestPost({ request, env }) {
  const email = String(request.headers.get("x-admin-email") || "").toLowerCase().trim();
  const allowed = (env?.ADMIN_ADMINS || "collabsbestie@gmail.com")
    .split(",").map(s=>s.trim().toLowerCase());
  if (!email) return j({ ok:false, error:"missing_admin_email" }, 401);
  if (!allowed.includes(email)) return j({ ok:false, error:"not_allowed", email }, 401);

  let body = {}; try { body = await request.json(); } catch {}
  const mode = body?.mode === "commit" ? "commit" : "dry-run";
  const id = (globalThis.crypto?.randomUUID?.()
              || (Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8)));

  return j({ ok:true, id, mode });
}

function j(obj, status=200){
  return new Response(JSON.stringify(obj), {
    status, headers: { "content-type":"application/json" }
  });
}