/**
 * POST /api/admin/import/brands/batches
 * Accepts:
 *  - JSON: { mode: "dry-run" | "commit" }  -> { ok:true, id, mode }
 *  - text/plain CSV                        -> { ok:true, id, mode:"dry-run", counts:{...}, header }
 */
export async function onRequestPost({ request, env }) {
  const email = String(request.headers.get("x-admin-email") || "").toLowerCase().trim();
  const allowed = (env?.ADMIN_ADMINS || "collabsbestie@gmail.com").split(",").map(s => s.trim().toLowerCase());
  if (!email) return j({ ok:false, error:"missing_admin_email" }, 401);
  if (!allowed.includes(email)) return j({ ok:false, error:"not_allowed", email }, 401);

  const ctype = String(request.headers.get("content-type") || "").toLowerCase();
  const id = (globalThis.crypto?.randomUUID?.() || (Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8)));

  // Path A: CSV upload to /batches (legacy client). Treat as dry-run and return counts.
  if (ctype.includes("text/plain")) {
    const text = await request.text();
    if (!text || !/[,;\n]/.test(text)) return j({ ok:false, error:"empty_or_not_csv" }, 400);

    const lines = text.replace(/\r/g, "").split("\n").filter(l => l.trim().length > 0);
    if (lines.length === 0) return j({ ok:false, error:"no_rows" }, 400);

    const header = lines.shift();
    const total = lines.length;
    let invalid = 0;
    for (const line of lines) {
      if (!line.trim()) invalid++;
    }
    const valid = Math.max(0, total - invalid);
    return j({ ok:true, id, mode:"dry-run", counts:{ total, valid, invalid }, header });
  }

  // Path B: JSON control payload to start a batch
  let body = {}; try { body = await request.json(); } catch {}
  const mode = body?.mode === "commit" ? "commit" : "dry-run";
  return j({ ok:true, id, mode });
}

function j(obj, status=200){
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type":"application/json" }
  });
}
