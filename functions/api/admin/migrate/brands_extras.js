export async function onRequestGet({ env }) {
  const db = env.DB;
  try {
    // Add columns if missing
    const adds = [
      "ALTER TABLE brands ADD COLUMN customer_age_min INTEGER",
      "ALTER TABLE brands ADD COLUMN customer_age_max INTEGER",
      "ALTER TABLE brands ADD COLUMN price_low REAL",
      "ALTER TABLE brands ADD COLUMN price_high REAL",
      "ALTER TABLE brands ADD COLUMN affiliate_program INTEGER DEFAULT 0",
      "ALTER TABLE brands ADD COLUMN cookie_days INTEGER DEFAULT 30",
      "ALTER TABLE brands ADD COLUMN contact_email TEXT",
      "ALTER TABLE brands ADD COLUMN contact_form_url TEXT",
      "ALTER TABLE brands ADD COLUMN brand_values TEXT",
      "ALTER TABLE brands ADD COLUMN monthly_site_visits INTEGER",
      "ALTER TABLE brands ADD COLUMN markets_primary TEXT DEFAULT 'US'"
    ];
    for (const sql of adds) { try { await db.prepare(sql).run(); } catch (_) {} }
    // Ensure slug exists and is TEXT UNIQUE
    try { await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug)").run(); } catch(_) {}
    return new Response(JSON.stringify({ ok:true }), { headers:{ "Content-Type":"application/json" }});
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:String(e) }), { status:500, headers:{ "Content-Type":"application/json" }});
  }
}
