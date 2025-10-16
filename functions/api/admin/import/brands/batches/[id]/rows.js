/**
 * POST /api/admin/import/brands/batches/:id/rows
 * Body: text/plain CSV
 * Returns: { ok:true, id, counts:{ total, valid, invalid }, header }
 * Notes: lightweight validator to unblock Dry run. Tighten later.
 */
export async function onRequestPost({ request, params, env }) {
  const email = String(request.headers.get("x-admin-email") || "").toLowerCase().trim();
  const allowed = String(env?.ADMIN_ADMINS || "collabsbestie@gmail.com")
    .split(",").map(s => s.trim().toLowerCase());
  if (!email) return j({ ok:false, error:"missing_admin_email" }, 401);
  if (!allowed.includes(email)) return j({ ok:false, error:"not_allowed", email }, 401);

  const id = String(params?.id || "").trim();
  if (!id) return j({ ok:false, error:"missing_batch_id" }, 400);

  const text = await request.text();
  if (!text || !/[,;\n]/.test(text)) return j({ ok:false, error:"empty_or_not_csv" }, 400);

  // Basic CSV parse
  const lines = text.replace(/\r/g, "").split("\n").filter(l => l.trim().length > 0);
  if (lines.length === 0) return j({ ok:false, error:"no_rows" }, 400);

  const header = lines.shift();
  const total = lines.length;

  // Minimal validation: non-empty rows count as valid
  // Hook for future rules: check required columns, URL shape, email, etc.
  let invalid = 0;
  for (const line of lines) {
    const bad = !line.trim();
    if (bad) invalid++;
  }
  const valid = Math.max(0, total - invalid);

  return j({ ok:true, id, counts:{ total, valid, invalid }, header });
}

function j(obj, status=200){
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type":"application/json" }
  });
}
