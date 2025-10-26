function cookieEmail(req){
  const c = req.headers.get("Cookie") || "";
  const m = c.split(";").map(s=>s.trim()).find(s=>s.startsWith("bestie_email="));
  return m ? decodeURIComponent(m.split("=").slice(1).join("=")) : "";
}
export async function onRequestPost({ request, env }) {
  const email = cookieEmail(request);
  if (!email) return new Response("unauthorized",{status:401});
  const b = await request.json().catch(()=>({}));
  const full = String(b.full_name||"").trim();
  const phone= String(b.phone||"").trim();
  if (!full) return new Response("bad_full_name",{status:400});
  const u = await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
  if (!u) return new Response("not_found",{status:404});
  await env.DB.prepare(`UPDATE users SET full_name=?, phone=?, updated_at=unixepoch() WHERE id=?`)
    .bind(full, phone, u.id).run();
  return new Response(null,{status:204});
}
