import { json, q } from "../api/admin/chipchip/_lib/db.js";

async function hashPBKDF2(password, saltB64, iterations = 100000) {
  const enc = new TextEncoder();
  const pwKey = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    pwKey,
    256
  );
  const bytes = new Uint8Array(bits);
  let b64 = "";
  for (let i = 0; i < bytes.length; i++) b64 += String.fromCharCode(bytes[i]);
  return btoa(b64);
}

function setCookie(resHeaders, name, value, maxAge = 31536000) {
  const v = encodeURIComponent(value);
  const attrs = [
    `${name}=${v}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Domain=bestiecollabs.com",
    `Max-Age=${maxAge}`
  ].join("; ");
  resHeaders.append("Set-Cookie", attrs);
}

export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const input = String(body.email || body.username || "").trim();
    const password = String(body.password || "");
    if (!input) return json({ ok: false, error: "missing email_or_username" }, 400);

    const sql = `
      SELECT id, email, username, role, pw_salt, pw_hash
      FROM users
      WHERE lower(email)=lower(?) OR lower(username)=lower(?)
      LIMIT 1
    `;
    const r = await q(env.DB, sql, [input, input]);
    const user = r?.results?.[0];
    if (!user) return json({ ok: false, error: "invalid_credentials" }, 401);

    if (user.pw_hash) {
      if (!password) return json({ ok: false, error: "invalid_credentials" }, 401);
      const calc = await hashPBKDF2(password, user.pw_salt);
      if (calc !== user.pw_hash) return json({ ok: false, error: "invalid_credentials" }, 401);
    }
    // If no pw_hash, allow login (account bootstrap).

    const headers = new Headers({ "cache-control": "no-store" });
    setCookie(headers, "bestie_email", user.email || input);

    return new Response(JSON.stringify({
      ok: true,
      user: { id: user.id, email: user.email, username: user.username, role: user.role }
    }), { status: 200, headers: { "content-type": "application/json; charset=utf-8", ...Object.fromEntries(headers) } });

  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}

export const onRequest = onRequestPost;
