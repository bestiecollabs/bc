/**
 * /api/admin/config/categories
 * GET -> { ok, categories: [] }
 * PUT body: { categories: ["Apparel","Beauty","Home"] }
 */
export const onRequest = async ({ request, env }) => {
  const admin = request.headers.get("x-admin-email");
  if (!admin) return json({ ok:false, error:"unauthorized" }, 401);

  const db = env.DB;
  if (request.method === "GET") {
    const row = await db.prepare("SELECT value FROM config WHERE key='allowed_categories'").first();
    const categories = row?.value ? JSON.parse(row.value) : [];
    return json({ ok:true, categories });
  }

  if (request.method === "PUT") {
    const body = await request.json().catch(()=>null);
    if (!body || !Array.isArray(body.categories)) return json({ ok:false, error:"bad_body" }, 400);
    const cats = body.categories.map(String).map(s=>s.trim()).filter(Boolean);
    const val = JSON.stringify(cats);
    await db.prepare(`
      INSERT INTO config (key,value) VALUES ('allowed_categories', ?1)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
    `).bind(val).run();
    return json({ ok:true, categories: cats });
  }

  return json({ ok:false, error:"method_not_allowed" }, 405);
};

function json(b, s=200){ return new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json'}}); }
