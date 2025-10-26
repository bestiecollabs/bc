const enc = new TextEncoder();
const b64 = a => btoa(String.fromCharCode(...a));
const b64toBytes = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function hashPw(pw, saltB){
  const keyMat = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name:"PBKDF2", hash:"SHA-256", salt: saltB, iterations:100000 }, keyMat, 256);
  return new Uint8Array(bits);
}
export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(()=>({}));
  const email = String(b.email||"").trim().toLowerCase();
  const password = String(b.password||"");
  if (!email || !password) {
    return new Response(JSON.stringify({ ok:false, error:"missing_fields" }), { status:400, headers:{ "Content-Type":"application/json" }});
  }
  const u = await env.DB.prepare("SELECT id,email,role,pw_salt,pw_hash FROM users WHERE email=?").bind(email).first();
  if (!u || !u.pw_hash) {
    return new Response(JSON.stringify({ ok:false, error:"not_found" }), { status:404, headers:{ "Content-Type":"application/json" }});
  }
  const calc = await hashPw(password, b64toBytes(u.pw_salt));
  if (b64(calc) !== u.pw_hash) {
    return new Response(JSON.stringify({ ok:false, error:"wrong_password" }), { status:401, headers:{ "Content-Type":"application/json" }});
  }
  const maxAge = 60*60*24*30;
  return new Response(JSON.stringify({ ok:true, redirect:"/account/" }), {
    headers:{
      "Content-Type":"application/json",
      "Set-Cookie": `bestie_email=${encodeURIComponent(email)}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`
    }
  });
}
