// Idempotent DB initializer for Bestie Collabs.
// Visit /dev/init once, then delete this file.
async function tableExists(db, name){
  const r = await db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").bind(name).first();
  return !!r;
}
async function ensureUsers(db){
  const exists = await tableExists(db, "users");
  if (!exists) {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT lower(hex(randomblob(16))),
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE,
        full_name TEXT,
        role TEXT NOT NULL CHECK (role IN ('brand','creator')),
        phone TEXT,
        terms_version TEXT,
        accepted_terms_at INTEGER,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
        pw_salt TEXT,
        pw_hash TEXT
      );
    `).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);`).run();
    return { created:true, altered:false };
  }
  // ensure password columns exist on older installs
  const cols = await db.prepare(`PRAGMA table_info('users')`).all();
  const names = new Set((cols.results||[]).map(c=>c.name));
  let altered = false;
  if (!names.has("pw_salt")) { await db.prepare(`ALTER TABLE users ADD COLUMN pw_salt TEXT;`).run(); altered = true; }
  if (!names.has("pw_hash")) { await db.prepare(`ALTER TABLE users ADD COLUMN pw_hash TEXT;`).run(); altered = true; }
  return { created:false, altered };
}
async function ensureAddresses(db){
  const exists = await tableExists(db, "addresses");
  if (!exists) {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS addresses (
        user_id TEXT PRIMARY KEY,
        country TEXT,
        street TEXT,
        city TEXT,
        region TEXT,
        postal TEXT,
        updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `).run();
    return { created:true };
  }
  return { created:false };
}
export async function onRequestGet({ env }) {
  const out = { ok:true, notes:[], users:{}, addresses:{}, tables:[] };
  try {
    await env.DB.prepare("select 1").first();
  } catch {
    return json({ ok:false, error:'DB binding "DB" missing or not reachable' }, 500);
  }
  out.users = await ensureUsers(env.DB);
  out.addresses = await ensureAddresses(env.DB);
  const t = await env.DB.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
  out.tables = t.results?.map(r=>r.name)||[];
  return json(out, 200);

  function json(body, status=200){
    return new Response(JSON.stringify(body), { status, headers:{ "Content-Type":"application/json" }});
  }
}
