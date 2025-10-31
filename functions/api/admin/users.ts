type Role = "brand"|"creator";
type Row = {
  id:number; email:string; username:string|null;
  role:Role; is_admin:number; created_at:number;
  suspended_at?:number|null; deleted_at?:number|null
};

export const onRequest: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const req = ctx.request, db = ctx.env.DB;

  // Access
  let jwt = req.headers.get("CF-Access-Jwt-Assertion");
  if (!jwt) { const m = /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(req.headers.get("Cookie")||""); if (m) jwt = m[1]; }
  if (!jwt) return new Response("Unauthorized", { status: 401 });

  const actorEmail = getEmailFromJwt(jwt) ?? "";
  const actor = actorEmail ? await db.prepare("SELECT id,is_admin FROM users WHERE lower(email)=lower(?1)").bind(actorEmail).first<{id:number,is_admin:number}>() : null;
  const isAdmin = !!(actor && actor.is_admin === 1);

  const url = new URL(req.url);
  const method = req.method.toUpperCase();

  if (method === "GET") {
    const r = await db.prepare("SELECT id,email,username,role,is_admin,created_at,suspended_at,deleted_at FROM users ORDER BY created_at DESC LIMIT 500").all<Row>();
    const items = (r.results??[]).map(u => ({
      id:u.id, email:u.email, username:u.username||"",
      account_type: u.is_admin ? "admin" : u.role,
      created_at:u.created_at, suspended:!!u.suspended_at, deleted:!!u.deleted_at
    }));
    return json({ ok:true, items });
  }

  // All mutations require admin
  if (!isAdmin) return json({ ok:false, error:"forbidden" }, 403);

  if (method === "POST") {
    const b = await safeJson(req) as any;
    const action = String(b?.action||"").toLowerCase();

    // Create (email required, username optional)
    if (!action) {
      const email = String(b?.email??"").trim().toLowerCase();
      const role  = (String(b?.role??"creator").toLowerCase() as Role);
      const username = normUser(String(b?.username??""));
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok:false, error:"invalid_email" }, 400);
      if (!["brand","creator"].includes(role)) return json({ ok:false, error:"invalid_role" }, 400);
      if (username && !validUser(username)) return json({ ok:false, error:"invalid_username" }, 400);

      // check username uniqueness if provided
      if (username) {
        const du = await db.prepare("SELECT 1 FROM users WHERE lower(username)=?1 LIMIT 1").bind(username).first();
        if (du) return json({ ok:false, error:"username_taken" }, 409);
      }

      try {
        const ins = await db.prepare("INSERT INTO users (email,role,username) VALUES (?1,?2,?3)").bind(email,role, username || null).run();
        await audit(db, actorEmail, "create", Number(ins.meta?.last_row_id??0), { email, role, username });
        return json({ ok:true, created:1 }, 201);
      } catch {
        const existing = await db.prepare("SELECT id FROM users WHERE lower(email)=?1").bind(email).first<{id:number}>();
        return json({ ok:true, existed: existing?.id ?? 0 }, 200);
      }
    }

    // Set username (edit)
    if (action === "set_username") {
      const id = num(b.id); if (!id) return json({ ok:false, error:"invalid_id" }, 400);
      const username = normUser(String(b?.username??""));
      if (!username) return json({ ok:false, error:"invalid_username" }, 400);
      if (!validUser(username)) return json({ ok:false, error:"invalid_username" }, 400);
      const du = await db.prepare("SELECT 1 FROM users WHERE lower(username)=?1 AND id<>?2 LIMIT 1").bind(username,id).first();
      if (du) return json({ ok:false, error:"username_taken" }, 409);
      const up = await db.prepare("UPDATE users SET username=?1, updated_at=unixepoch() WHERE id=?2").bind(username,id).run();
      if (Number(up.meta?.changes??0)===0) return json({ ok:false, error:"not_found" }, 404);
      await audit(db, actorEmail, "set_username", id, { username });
      return json({ ok:true, updated:1 });
    }

    // existing actions preserved
    if (action === "suspend" || action === "unsuspend") { /* ... unchanged ... */ }
    if (action === "delete" || action === "undelete")   { /* ... unchanged ... */ }
    if (action === "set_account_type")                  { /* ... unchanged ... */ }

    return json({ ok:false, error:"unknown_action" }, 400);
  }

  return new Response("Method Not Allowed", { status:405, headers:{ Allow:"GET, POST" } });
};

function normUser(s:string){ return s.trim().toLowerCase(); }
function validUser(s:string){ return /^[a-z0-9._-]{3,30}$/.test(s); }

function num(v:any){ const n=Number(v); return Number.isInteger(n)&&n>0?n:0; }
async function adminCount(db:D1Database, excludingId?:number){ const q = excludingId? "SELECT COUNT(*) AS c FROM users WHERE is_admin=1 AND deleted_at IS NULL AND id<>?1" : "SELECT COUNT(*) AS c FROM users WHERE is_admin=1 AND deleted_at IS NULL"; const r = excludingId? await db.prepare(q).bind(excludingId).first<{c:number}>() : await db.prepare(q).first<{c:number}>(); return Number((r as any)?.c??0); }
async function audit(db:D1Database, actor:string, action:string, target:number, meta:unknown){ await ensureAudit(db); await db.prepare("INSERT INTO admin_audit(actor_email,action,target_user_id,meta) VALUES (?1,?2,?3,?4)").bind(actor,action,target,JSON.stringify(meta??{})).run(); }
let auditReady=false; async function ensureAudit(db:D1Database){ if(auditReady) return; await db.prepare("CREATE TABLE IF NOT EXISTS admin_audit(id INTEGER PRIMARY KEY, actor_email TEXT NOT NULL, action TEXT NOT NULL, target_user_id INTEGER, meta TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()))").run(); auditReady=true; }
function getEmailFromJwt(jwt:string){ try{const p=jwt.split("."); if(p.length<2)return null; const payload=JSON.parse(atob(p[1].replace(/-/g,"+").replace(/_/g,"/"))); return String(payload.email||payload.sub||"")||null;}catch{return null;} }
async function safeJson(req:Request){ try{ return await req.json(); } catch { return {}; } }
function json(data:unknown,status=200){ return new Response(JSON.stringify(data),{ status, headers:{ "Content-Type":"application/json","Cache-Control":"no-store"} }); }
