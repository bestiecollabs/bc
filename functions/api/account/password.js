function cookieEmail(req){
  const c = req.headers.get("Cookie") || "";
  const m = c.split(";").map(s=>s.trim()).find(s=>s.startsWith("bestie_email="));
  return m ? decodeURIComponent(m.split("=").slice(1).join("=")) : "";
}
const enc = new TextEncoder();
const b64 = a => btoa(String.fromCharCode(...a));
const b64toBytes = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function hashPw(pw, saltB){
  const keyMat = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name:"PBKDF2", hash:"SHA-256", salt: saltB, iterations:100000 }, keyMat, 256);
  return new Uint8Array(bits);
}

export async function onRequestPost({ request, env }) {
  const email = cookieEmail(request);
  if (!email) return new Response(JSON.stringify({ ok:false, error:"unauthorized" }), { status:401, headers:{ "Content-Type":"application/json" }});
  const b = await request.json().catch(()=>({}));
  const curr = String(b.current||"");
  const next = String(b.password||"");
  if (!next || next.length < 8) return new Response(JSON.stringify({ ok:false, error:"bad_password" }), { status:400, headers:{ "Content-Type":"application/json" }});

  const u = await env.DB.prepare("SELECT id, pw_salt, pw_hash FROM users WHERE email=?").bind(email).first();
  if (!u) return new Response(JSON.stringify({ ok:false, error:"not_found" }), { status:404, headers:{ "Content-Type":"application/json" }});

  // verify current if hash exists
  if (u.pw_hash) {
    const saltB = b64toBytes(u.pw_salt||"");
    const calc  = await hashPw(curr, saltB);
    if (b64(calc) !== (u.pw_hash||"")) {
      return new Response(JSON.stringify({ ok:false, error:"wrong_password" }), { status:400, headers:{ "Content-Type":"application/json" }});
    }
  }

  // set new
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await hashPw(next, salt);
  await env.DB.prepare("UPDATE users SET pw_salt=?, pw_hash=?, updated_at=unixepoch() WHERE id=?")
    .bind(b64(salt), b64(hash), u.id).run();

  return new Response(JSON.stringify({ ok:true }), { headers:{ "Content-Type":"application/json" }});
}
