/**
 * POST /api/admin/import/brands/batches/:id/commit
 * Body: optional JSON { dryRunCounts?, metadata? }
 * Returns: { ok:true, id, committed:true }
 */
export async function onRequestPost({ request, params, env }) {
  const email = String(request.headers.get("x-admin-email") || "").toLowerCase().trim();
  const allowed = String(env?.ADMIN_ADMINS || "collabsbestie@gmail.com")
    .split(",").map(s => s.trim().toLowerCase());
  if (!email) return j({ ok:false, error:"missing_admin_email" }, 401);
  if (!allowed.includes(email)) return j({ ok:false, error:"not_allowed", email }, 401);

  const id = String(params?.id || "").trim();
  if (!id) return j({ ok:false, error:"missing_batch_id" }, 400);

  // Accept but ignore body for now; real implementation can insert rows into D1.
  try { await request.json(); } catch {}

  return j({ ok:true, id, committed:true });
}

function j(obj, status=200){
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type":"application/json" }
  });
}
