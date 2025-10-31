type Role = "brand"|"creator";
type Row = { id:number; email:string; role:Role; is_admin:number; created_at:number; suspended_at?:number|null; deleted_at?:number|null };

export const onRequest: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const req = ctx.request, db = ctx.env.DB;

  // Access via header or CF Access cookie
  let jwt = req.headers.get("CF-Access-Jwt-Assertion");
  if (!jwt) { const m = /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(req.headers.get("Cookie")||""); if (m) jwt = m[1]; }
  if (!jwt) return new Response("Unauthorized", { status: 401 });

  const actor = getEmailFromJwt(jwt) ?? "unknown@unknown";
  const url = new URL(req.url);
  const method = req.method.toUpperCase();

  if (method === "GET") {
    const r = await db.prepare("SELECT id,email,role,is_admin,created_at,suspended_at,deleted_at FROM users ORDER BY created_at DESC LIMIT 500").all<Row>();
    const items = (r.results??[]).map(u => ({
      id:u.id,
      email:u.email,
      account_type: u.is_admin ? "admin" : u.role,
      created_at:u.created_at,
      suspended: !!u.suspended_at,
      deleted:   !!u.deleted_at
    }));
    return json({ ok:true, items });
  }

  if (method === "POST") {
    const b = await safeJson(req) as any;
    const action = String(b?.action||"").toLowerCase();

    // Create
    if (!action) {
      const email = String(b?.email??"").trim().toLowerCase();
      const role  = (String(b?.role??"creator").toLowerCase() as Role);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok:false, error:"invalid_email" }, 400);
      if (!["brand","creator"].includes(role)) return json({ ok:false, error:"invalid_role" }, 400);
      const ins = await db.prepare("INSERT INTO users (email,role) VALUES (?1,?2)").bind(email,role).run();
      await audit(db, actor, "create", Number(ins.meta?.last_row_id??0), { email, role });
      return json({ ok:true, created:1 }, 201);
    }

    // Suspend / Unsuspend
    if (action === "suspend" || action === "unsuspend") {
      const id = num(b.id); if (!id) return json({ ok:false, error:"invalid_id" }, 400);
      const u = await db.prepare("SELECT id,is_admin,suspended_at FROM users WHERE id=?1").bind(id).first<Row>();
      if (!u) return json({ ok:false, error:"not_found" }, 404);
      if (action === "suspend") {
        if (u.is_admin && (await adminCount(db, id))<=0) return json({ ok:false, error:"last_admin_blocked" }, 400);
        if (!u.suspended_at) await db.prepare("UPDATE users SET suspended_at=unixepoch(), updated_at=unixepoch() WHERE id=?1").bind(id).run();
        await audit(db, actor, "suspend", id, {});
        return json({ ok:true, suspended:1 });
      } else {
        await db.prepare("UPDATE users SET suspended_at=NULL, updated_at=unixepoch() WHERE id=?1").bind(id).run();
        await audit(db, actor, "unsuspend", id, {});
        return json({ ok:true, unsuspended:1 });
      }
    }

    // Delete / Undelete (soft delete)
    if (action === "delete" || action === "undelete") {
      const id = num(b.id); if (!id) return json({ ok:false, error:"invalid_id" }, 400);
      const u = await db.prepare("SELECT id,is_admin,deleted_at FROM users WHERE id=?1").bind(id).first<Row>();
      if (!u) return json({ ok:false, error:"not_found" }, 404);
      if (action === "delete") {
        if (u.is_admin && (await adminCount(db, id))<=0) return json({ ok:false, error:"last_admin_blocked" }, 400);
        if (!u.deleted_at) await db.prepare("UPDATE users SET deleted_at=unixepoch(), updated_at=unixepoch() WHERE id=?1").bind(id).run();
        await audit(db, actor, "delete_soft", id, {});
        return json({ ok:true, deleted:1 });
      } else {
        await db.prepare("UPDATE users SET deleted_at=NULL, updated_at=unixepoch() WHERE id=?1").bind(id).run();
        await audit(db, actor, "undelete", id, {});
        return json({ ok:true, undeleted:1 });
      }
    }

    // Account type change
    if (action === "set_account_type") {
      const id = num(b.id); const to = String(b?.account_type??"").toLowerCase();
      if (!id) return json({ ok:false, error:"invalid_id" }, 400);
      if (!["brand","creator","admin"].includes(to)) return json({ ok:false, error:"invalid_account_type" }, 400);
      const cur = await db.prepare("SELECT is_admin FROM users WHERE id=?1").bind(id).first<Row>(); if (!cur) return json({ ok:false, error:"not_found" }, 404);
      if (to === "admin") await db.prepare("UPDATE users SET is_admin=1, updated_at=unixepoch() WHERE id=?1").bind(id).run();
      else {
        if (cur.is_admin && (await adminCount(db, id))<=0) return json({ ok:false, error:"last_admin_blocked" }, 400);
        await db.prepare("UPDATE users SET is_admin=0, role=?1, updated_at=unixepoch() WHERE id=?2").bind(to, id).run();
      }
      await audit(db, actor, "set_account_type", id, { to });
      return json({ ok:true, updated:1 });
    }

    return json({ ok:false, error:"unknown_action" }, 400);
  }

  return new Response("Method Not Allowed", { status:405, headers:{ Allow:"GET, POST" } });
};

function num(v:any){ const n=Number(v); return Number.isInteger(n)&&n>0?n:0; }
async function adminCount(db:D1Database, excludingId?:number){ const q = excludingId? "SELECT COUNT(*) AS c FROM users WHERE is_admin=1 AND deleted_at IS NULL AND id<>?1" : "SELECT COUNT(*) AS c FROM users WHERE is_admin=1 AND deleted_at IS NULL"; const r = excludingId? await db.prepare(q).bind(excludingId).first<{c:number}>() : await db.prepare(q).first<{c:number}>(); return Number((r as any)?.c??0); }
async function audit(db:D1Database, actor:string, action:string, target:number, meta:unknown){ await ensureAudit(db); await db.prepare("INSERT INTO admin_audit(actor_email,action,target_user_id,meta) VALUES (?1,?2,?3,?4)").bind(actor,action,target,JSON.stringify(meta??{})).run(); }
let auditReady=false; async function ensureAudit(db:D1Database){ if(auditReady) return; await db.prepare("CREATE TABLE IF NOT EXISTS admin_audit(id INTEGER PRIMARY KEY, actor_email TEXT NOT NULL, action TEXT NOT NULL, target_user_id INTEGER, meta TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()))").run(); auditReady=true; }
function getEmailFromJwt(jwt:string){ try{const p=jwt.split("."); if(p.length<2)return null; const payload=JSON.parse(atob(p[1].replace(/-/g,"+").replace(/_/g,"/"))); return String(payload.email||payload.sub||"")||null;}catch{return null;} }
async function safeJson(req:Request){ try{ return await req.json(); } catch { return {}; } }
function json(data:unknown,status=200){ return new Response(JSON.stringify(data),{ status, headers:{ "Content-Type":"application/json","Cache-Control":"no-store"} }); }
