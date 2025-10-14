export async function onRequestGet({ env }) {
  const db = env.DB;
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS import_batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
        source_uri TEXT,
        status TEXT DEFAULT 'new'
      );
      CREATE TABLE IF NOT EXISTS import_rows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id INTEGER NOT NULL,
        row_num INTEGER NOT NULL,
        parsed_json TEXT NOT NULL,
        errors_json TEXT DEFAULT '[]',
        valid INTEGER DEFAULT 0,
        FOREIGN KEY(batch_id) REFERENCES import_batches(id)
      );
      CREATE TABLE IF NOT EXISTS brand_drafts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_row_id INTEGER,
        data_json TEXT NOT NULL,
        issues_json TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
      );
    `);
    try { await db.exec(`ALTER TABLE brands ADD COLUMN is_public INTEGER DEFAULT 0;`); } catch(e) {}
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" }});
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:String(e) }), { status:500, headers:{ "Content-Type":"application/json"}});
  }
}
