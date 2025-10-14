export async function onRequestGet({ env }) {
  const db = env.DB;
  try {
    await db.prepare("CREATE TABLE IF NOT EXISTS import_batches (id INTEGER PRIMARY KEY, created_at TEXT, source_uri TEXT, status TEXT)").run();
    await db.prepare("CREATE TABLE IF NOT EXISTS import_rows (id INTEGER PRIMARY KEY, batch_id INTEGER NOT NULL, row_num INTEGER NOT NULL, parsed_json TEXT NOT NULL, errors_json TEXT, valid INTEGER)").run();
    await db.prepare("CREATE INDEX IF NOT EXISTS idx_import_rows_batch ON import_rows(batch_id)").run();
    await db.prepare("CREATE TABLE IF NOT EXISTS brand_drafts (id INTEGER PRIMARY KEY, source_row_id INTEGER, data_json TEXT NOT NULL, issues_json TEXT, created_at TEXT)").run();
    try { await db.prepare("ALTER TABLE brands ADD COLUMN is_public INTEGER").run(); } catch(e) {}
    return new Response(JSON.stringify({ ok:true }), { headers:{ "Content-Type":"application/json" }});
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:String(e) }), { status:500, headers:{ "Content-Type":"application/json" }});
  }
}
