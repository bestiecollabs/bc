export async function onRequestGet({ env }) {
  const db = env.DB;
  // Columns the app expects on table `brands`
  const cols = [
    ["is_public","INTEGER DEFAULT 0"],
    ["country","TEXT"],["state","TEXT"],["city","TEXT"],["zipcode","TEXT"],["address","TEXT"],
    ["contact_name","TEXT"],["contact_title","TEXT"],["contact_email","TEXT"],["contact_phone","TEXT"],
    ["customer_age_min","INTEGER DEFAULT 0"],["customer_age_max","INTEGER DEFAULT 0"],
    ["price_low","REAL DEFAULT 0"],["price_high","REAL DEFAULT 0"],
    ["affiliate_program","TEXT"],["affiliate_cookie_days","INTEGER DEFAULT 30"],
    ["monthly_visits","INTEGER DEFAULT 0"],["brand_values","TEXT"],["gifting_ok","INTEGER DEFAULT 0"]
  ];
  try {
    for (const [name, type] of cols) {
      try { await db.prepare(`ALTER TABLE brands ADD COLUMN ${name} ${type}`).run(); } catch (_) {}
    }
    // Ensure UNIQUE slug for upserts
    try { await db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug)`).run(); } catch (_) {}
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" }});
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:String(e) }), { status:500, headers:{ "Content-Type":"application/json"}});
  }
}
