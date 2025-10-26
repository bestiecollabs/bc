// PBKDF2 helpers
const enc = new TextEncoder();
const b64 = a => btoa(String.fromCharCode(...a));
async function hashPassword(pw) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMat = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name:"PBKDF2", hash:"SHA-256", salt, iterations:100000 }, keyMat, 256);
  return { salt: b64(salt), hash: b64(new Uint8Array(bits)) };
}

export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(()=>({}));
  const email = String(b.email||"").trim().toLowerCase();
  const username = String(b.username||"").trim();
  const usernameNorm = username.toLowerCase(); // for collision checks
  const full_name = String(b.full_name||"").trim();
  const phone = String(b.phone||"").trim();
  const role = b.role === "creator" ? "creator" : "brand";
  const accepted = !!b.accepted_terms;
  const terms_version = String(b.terms_version||"v1");
  const password = String(b.password||"");

  const bad = (code, status=400) =>
    new Response(JSON.stringify({ ok:false, error:code }), {
      status, headers:{ "Content-Type":"application/json" }
    });

  // required (address removed)
  if (!email || !username || !full_name || !accepted) return bad("missing_fields");
  if (!/^[A-Za-z0-9_]{3,15}$/.test(username)) return bad("bad_username");
  if (password.length < 8 || password.length > 15) return bad("bad_password");

  const db = env.DB;

  // must be seeded by /auth/start
  const user = await db.prepare(
    "SELECT id, role FROM users WHERE email=?"
  ).bind(email).first();
  if (!user) return bad("not_started");
  if (user.role !== role) return bad("role_mismatch", 409);

  // 1) hard pre-check for username collisions (case-insensitive)
  const existing = await db.prepare(
    "SELECT id FROM users WHERE LOWER(username)=? AND id<>?"
  ).bind(usernameNorm, user.id).first();
  if (existing) return bad("username_taken", 409);

  // 2) proceed with update
  const { salt, hash } = await hashPassword(password);

  try {
    await db.prepare(`
      UPDATE users SET
        username=?,
        full_name=?,
        phone=?,
        terms_version=?,
        accepted_terms_at=unixepoch(),
        pw_salt=?,
        pw_hash=?,
        updated_at=unixepoch()
      WHERE id=?;
    `).bind(username, full_name, phone, terms_version, salt, hash, user.id).run();
  } catch (e) {
    const msg = (e && e.message) || "";
    // keep UNIQUE fallback if schema enforces it
    if (msg.includes("UNIQUE") && msg.includes("users.username")) return bad("username_taken", 409);
    throw e;
  }

  return new Response(JSON.stringify({ ok:true }), {
    headers:{ "Content-Type":"application/json" }
  });
}
