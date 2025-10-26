// Idempotent signup start: allows pending signups to retry without tripping "already_registered".
// Blocks only fully registered accounts.

export async function onRequestPost({ request, env }) {
  const db = env.DB;

  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const role  = body.role === "creator" ? "creator" : "brand";

  const bad = (code, status = 400) =>
    new Response(JSON.stringify({ ok: false, error: code }), {
      status,
      headers: { "Content-Type": "application/json" }
    });

  if (!email) return bad("missing_email");

  // Check existing by email
  const u = await db.prepare(
    "SELECT id, role, pw_hash, accepted_terms_at FROM users WHERE email=?"
  ).bind(email).first();

  // Case A: fully registered account exists -> block
  if (u && u.pw_hash && u.accepted_terms_at) {
    return bad("already_registered", 409);
  }

  // Case B: pending record exists -> reuse and align role
  if (u) {
    await db.prepare(
      "UPDATE users SET role=?, updated_at=unixepoch() WHERE id=?"
    ).bind(role, u.id).run();

    return new Response(JSON.stringify({ ok: true, role }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // Case C: create pending record
  await db.prepare(`
    INSERT INTO users (email, role, created_at, updated_at)
    VALUES (?, ?, unixepoch(), unixepoch())
  `).bind(email, role).run();

  return new Response(JSON.stringify({ ok: true, role }), {
    headers: { "Content-Type": "application/json" }
  });
}
