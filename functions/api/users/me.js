function cookieEmail(req){
  const c = req.headers.get("Cookie") || "";
  const m = c.split(";").map(s=>s.trim()).find(s=>s.startsWith("bestie_email="));
  return m ? decodeURIComponent(m.split("=").slice(1).join("=")) : "";
}
export async function onRequestGet({ request, env }) {
  const email = cookieEmail(request);
  if (!email) return new Response(JSON.stringify({ ok:false }), { headers:{ "Content-Type":"application/json" }});
  const u = await env.DB.prepare("SELECT id,email,username,full_name,role,phone FROM users WHERE email=?").bind(email).first();
  const a = u ? await env.DB.prepare("SELECT street,city,region AS state,postal AS zip FROM addresses WHERE user_id=?").bind(u.id).first() : null;
  return new Response(JSON.stringify({ ok: !!u, user:u||null, address:a||null }), { headers:{ "Content-Type":"application/json" }});
}
