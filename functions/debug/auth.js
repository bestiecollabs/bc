export async function onRequestGet({ request, env }) {
  const out = { ok:true, hasDB:false, tables:[], users_count:null, users_columns:[], user:null, notes:[] };

  // DB reachable?
  try {
    await env.DB.prepare('select 1').first();
    out.hasDB = true;
  } catch (e) {
    out.ok = false;
    out.notes.push('DB binding "DB" missing or not reachable');
    return json(out, 500);
  }

  // tables
  const t = await env.DB.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
  out.tables = t.results?.map(r=>r.name)||[];

  // users count
  const ucnt = await env.DB.prepare(`SELECT count(*) AS n FROM users`).first().catch(()=>null);
  out.users_count = ucnt?.n ?? null;

  // users schema
  const cols = await env.DB.prepare(`PRAGMA table_info('users')`).all().catch(()=>({results:[]}));
  out.users_columns = cols.results?.map(c=>({name:c.name,type:c.type}))||[];

  // optional single user
  const email = new URL(request.url).searchParams.get('email')||'';
  if (email) {
    out.user = await env.DB.prepare(`SELECT id,email,role,username FROM users WHERE email=?`)
      .bind(email.toLowerCase()).first().catch(()=>null);
  }

  return json(out, 200);

  function json(body, status=200){
    return new Response(JSON.stringify(body), { status, headers:{ "Content-Type":"application/json" }});
  }
}
