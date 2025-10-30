/**
 * POST /api/signup
 * JSON: { email, username, password, confirmPassword, role, acceptTerms }
 */
export async function onRequestPost(ctx) {
  try {
    const { request, env } = ctx;
    if (!env?.DB) return json(500, { ok:false, message:"Database not available" });

    let body;
    try { body = await request.json(); }
    catch { return json(400, { ok:false, message:"Invalid JSON body" }); }

    const emailRaw = String(body?.email ?? "").trim();
    const usernameRaw = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "");
    const confirmPassword = String(body?.confirmPassword ?? "");
    const role = String(body?.role ?? "").trim().toLowerCase();
    const acceptTerms = body?.acceptTerms === true;

    const email = emailRaw.toLowerCase();
    const username = usernameRaw;

    // validations
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return json(400, { ok:false, field:"email", message:"Enter a valid email." });
    if (!username)
      return json(400, { ok:false, field:"username", message:"Username is required." });
    if (!password)
      return json(400, { ok:false, field:"password", message:"Password is required." });
    if (password !== confirmPassword)
      return json(400, { ok:false, field:"confirmPassword", message:"Passwords do not match." });
    if (!["brand","creator"].includes(role))
      return json(400, { ok:false, field:"role", message:"Choose brand or creator." });
    if (!acceptTerms)
      return json(400, { ok:false, field:"acceptTerms", message:"You must accept the terms." });

    // uniqueness with LIMIT 1
    const emailExists = await env.DB
      .prepare('SELECT id FROM users WHERE lower(email)=lower(?) LIMIT 1')
      .bind(email).first();
    if (emailExists)
      return json(409, { ok:false, field:"email", message:"Email is already registered." });

    const usernameExists = await env.DB
      .prepare('SELECT id FROM users WHERE lower(username)=lower(?) LIMIT 1')
      .bind(username).first();
    if (usernameExists)
      return json(409, { ok:false, field:"username", message:"Username is taken." });

    // PBKDF2-SHA256 with 16-byte salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hashHex = await pbkdf2Sha256Hex(password, salt, 150000);
    const saltHex = toHex(salt);

    // insert (timestamps are unixepoch() by default; store accepted_terms_at)
    const res = await env.DB.prepare(
      `INSERT INTO users (email, username, role, pw_hash, pw_salt, accepted_terms_at)
       VALUES (?, ?, ?, ?, ?, unixepoch())`
    ).bind(email, username, role, hashHex, saltHex).run();

    if (!res.success) {
      console.error('Insert failed', res);
      return json(500, { ok:false, message:"Could not create account." });
    }

    return json(200, { ok:true, next:"login", message:"Account created. Please sign in." });
  } catch (err) {
    console.error(err);
    return json(500, { ok:false, message:"Unexpected error." });
  }
}

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type':'application/json; charset=utf-8' }
  });
}

async function pbkdf2Sha256Hex(password, saltBytes, iterations) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name:'PBKDF2' }, false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name:'PBKDF2', hash:'SHA-256', salt: saltBytes, iterations },
    keyMaterial, 256
  );
  return toHex(new Uint8Array(bits));
}

function toHex(bytes) { return [...bytes].map(b => b.toString(16).padStart(2,'0')).join(''); }
