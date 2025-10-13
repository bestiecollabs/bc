export async function onRequest(ctx) {
  const { request } = ctx;
  const u = new URL(request.url);
  let email = (u.searchParams.get("email") || "").trim().toLowerCase();
  let next = (u.searchParams.get("next") || "/login/").trim();
  if (!email && request.method === "POST") {
    try { const body = await request.json(); email = String(body?.email||"").trim().toLowerCase(); if (body?.next) next = String(body.next).trim(); } catch {}
  }
  if (!email) return new Response(JSON.stringify({ ok:false, error:"missing_email" }), { status:400, headers:{ "content-type":"application/json","cache-control":"no-store" }});
  const base = `bestie_email=${encodeURIComponent(email)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure; HttpOnly`;
  const headers = new Headers({ "cache-control":"no-store" });
  headers.append("Set-Cookie", base);
  if (u.hostname.endsWith("bestiecollabs.com")) headers.append("Set-Cookie", base + "; Domain=bestiecollabs.com");
  const wantsJson = (request.headers.get("content-type")||"").includes("application/json") || (request.headers.get("accept")||"").includes("application/json");
  if (wantsJson) { headers.set("content-type","application/json"); return new Response(JSON.stringify({ ok:true, next }), { status:200, headers }); }
  headers.set("location", next || "/login/"); return new Response(null, { status:302, headers });
}
