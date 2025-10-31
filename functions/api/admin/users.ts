type Role = "brand"|"creator";
type Row = { id: number; email: string; role: Role; is_admin: number; created_at: number; deleted_at?: number|null };

export const onRequest: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const req = ctx.request;
  const db  = ctx.env.DB;

  // Access via header or CF Access cookie
  let jwt = req.headers.get("CF-Access-Jwt-Assertion");
  if (!jwt) {
    const m = /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(req.headers.get("Cookie") || "");
    if (m) jwt = m[1];
  }
  if (!jwt) return new Response("Unauthorized", { status: 401 });

  const actorEmail = getEmailFromJwt(jwt) ?? "unknown@unknown";
  const url = new URL(req.url);
  const method = req.method.toUpperCase();

  if (method === "GET") {
    const includeSuspended = url.searchParams.get("include_suspended") === "1";
    const sql = includeSuspended
      ? "SELECT id,email,role,is_admin,created_at,deleted_at FROM users ORDER BY created_at DESC LIMIT 200"
      : "SELECT id,email,role,is_admin,created_at,deleted_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 200";
    const r = await db.prepare(sql).all<Row>();
    const items = (r.results ?? []).map(u => ({
      id: u.id,
      email: u.email,
      account_type: u.is_admin ? "admin" : u.role,   // derive account type
      created_at: u.created_at,
      suspended: !!u.deleted_at,
    }));
    return json({ ok: true, count: items.length, items, actor: actorEmail });
  }

  if (method === "POST") {
    const body = await safeJson(req) as any;
    const action = String(body?.action || "").toLowerCase();

    // Create user
    if (!action) {
      const email = String(body?.email ?? "").trim().toLowerCase();
      const role  = (String(body?.role ?? "creator").toLowerCase() as Role);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: "invalid_email" }, 400);
      if (!["brand","creator"].includes(role)) return json({ ok: false, error: "invalid_role" }, 400);
      const ins = await db.prepare("INSERT INTO users (email, role) VALUES (?1, ?2)").bind(email, role).run();
      const id = Number(ins.meta?.last_row_id ?? 0);
      await audit(db, actorEmail, "create", id, { email, role });
      const row = await db.prepare("SELECT id,email,role,is_admin,created_at FROM users WHERE id=?1").bind(id).first<Row>();
      return json({ ok: true, created: { id: row!.id, email: row!.email, account_type: row!.is_admin ? "admin" : row!.role, created_at: row!.created_at } }, 201);
    }

    // Suspend
    if (action === "suspend") {
      const id = Number(body?.id ?? 0);
      if (!Number.isInteger(id) || id <= 0) return json({ ok: false, error: "invalid_id" }, 400);
      const u = await db.prepare("SELECT id,email,is_admin,deleted_at FROM users WHERE id=?1").bind(id).first<Row>();
      if (!u) return json({ ok: false, error: "not_found" }, 404);
      if (u.deleted_at) return json({ ok: true, suspended: 0 });
      if (u.is_admin) {
        const admins = await activeAdminCount(db, id);
        if (admins <= 0) return json({ ok: false, error: "last_admin_blocked" }, 400);
      }
      await db.prepare("UPDATE users SET deleted_at=unixepoch(), updated_at=unixepoch() WHERE id=?1").bind(id).run();
      await audit(db, actorEmail, "suspend", id, { email: u.email });
      return json({ ok: true, suspended: 1 });
    }

    // Unsuspend
    if (action === "unsuspend") {
      const id = Number(body?.id ?? 0);
      if (!Number.isInteger(id) || id <= 0) return json({ ok: false, error: "invalid_id" }, 400);
      await db.prepare("UPDATE users SET deleted_at=NULL, updated_at=unixepoch() WHERE id=?1").bind(id).run();
      await audit(db, actorEmail, "unsuspend", id, {});
      return json({ ok: true, unsuspended: 1 });
    }

    // Change account type
    if (action === "set_account_type") {
      const id = Number(body?.id ?? 0);
      const to = String(body?.account_type ?? "").toLowerCase();
      if (!Number.isInteger(id) || id <= 0) return json({ ok: false, error: "invalid_id" }, 400);
      if (!["brand","creator","admin"].includes(to)) return json({ ok: false, error: "invalid_account_type" }, 400);

      const before = await db.prepare("SELECT is_admin FROM users WHERE id=?1").bind(id).first<Row>();
      if (!before) return json({ ok: false, error: "not_found" }, 404);

      if (to === "admin") {
        await db.prepare("UPDATE users SET is_admin=1, updated_at=unixepoch() WHERE id=?1").bind(id).run();
      } else {
        // demote admin -> brand|creator, guard last admin
        if (before.is_admin) {
          const admins = await activeAdminCount(db, id);
          if (admins <= 0) return json({ ok: false, error: "last_admin_blocked" }, 400);
        }
        await db.prepare("UPDATE users SET is_admin=0, role=?1, updated_at=unixepoch() WHERE id=?2").bind(to, id).run();
      }
      await audit(db, actorEmail, "set_account_type", id, { to });
      return json({ ok: true, updated: 1 });
    }

    return json({ ok: false, error: "unknown_action" }, 400);
  }

  if (method === "DELETE") {
    const id = Number(new URL(req.url).searchParams.get("id") ?? 0);
    if (!Number.isInteger(id) || id <= 0) return json({ ok: false, error: "invalid_id" }, 400);
    const u = await db.prepare("SELECT id,is_admin FROM users WHERE id=?1").bind(id).first<Row>();
    if (!u) return json({ ok: false, error: "not_found" }, 404);
    if (u.is_admin) {
      const admins = await activeAdminCount(db, id);
      if (admins <= 0) return json({ ok: false, error: "last_admin_blocked" }, 400);
    }
    await db.prepare("DELETE FROM users WHERE id=?1").bind(id).run();
    await audit(db, actorEmail, "delete", id, {});
    return json({ ok: true, deleted: 1 });
  }

  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, POST, DELETE" } });
};

async function activeAdminCount(db: D1Database, excludingId?: number): Promise<number> {
  if (excludingId) {
    const r = await db.prepare("SELECT COUNT(*) AS c FROM users WHERE is_admin=1 AND deleted_at IS NULL AND id<>?1").bind(excludingId).first<{c:number}>();
    return Number((r as any)?.c ?? 0);
  }
  const r = await db.prepare("SELECT COUNT(*) AS c FROM users WHERE is_admin=1 AND deleted_at IS NULL").first<{c:number}>();
  return Number((r as any)?.c ?? 0);
}

async function audit(db: D1Database, actor: string, action: string, target: number, meta: unknown) {
  await ensureAuditTable(db);
  await db.prepare("INSERT INTO admin_audit (actor_email, action, target_user_id, meta) VALUES (?1, ?2, ?3, ?4)")
    .bind(actor, action, target, JSON.stringify(meta ?? {})).run();
}
let auditReady = false;
async function ensureAuditTable(db: D1Database) {
  if (auditReady) return;
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS admin_audit(
      id INTEGER PRIMARY KEY,
      actor_email TEXT NOT NULL,
      action TEXT NOT NULL,
      target_user_id INTEGER,
      meta TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`).run();
  } finally { auditReady = true; }
}
function getEmailFromJwt(jwt: string): string | null {
  try {
    const p = jwt.split("."); if (p.length < 2) return null;
    const payload = JSON.parse(atob(p[1].replace(/-/g,"+").replace(/_/g,"/")));
    return String(payload.email || payload.sub || "") || null;
  } catch { return null; }
}
async function safeJson(req: Request): Promise<unknown> { try { return await req.json(); } catch { return {}; } }
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
