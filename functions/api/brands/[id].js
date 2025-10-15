export const onRequestGet = async (context) => {
  const { params, env } = context;
  const db = env.DB || env.bestiedb;

  const id = String((params && params.id) || "").trim();
  if (!id) return json({ ok:false, error:"missing_id" }, 400);

  const row = await db.prepare(
    "SELECT id, name, website_url, category_primary, category_secondary, category_tertiary, " +
    "description, logo_url, instagram_url, tiktok_url, status, has_us_presence, " +
    "is_dropshipper, created_at, updated_at " +
    "FROM brands WHERE id = ?"
  ).bind(id).first();

  if (!row) return json({ ok:false, error:"not_found" }, 404);

  if (row.is_dropshipper || !row.has_us_presence || row.status === 'archived') {
    return json({ ok:false, error:"not_public" }, 404);
  }

  return json(row);
};

function json(b, s=200){
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
