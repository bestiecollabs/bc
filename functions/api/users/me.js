function parseCookies(req) {
  const raw = req.headers.get("cookie") || "";
  const out = {};
  raw.split(";").forEach(kv => {
    const i = kv.indexOf("="); if (i > -1) { out[kv.slice(0,i).trim()] = decodeURIComponent(kv.slice(i+1).trim()); }
  });
  return out;
}

export async function onRequestGet({ request }) {
  const headers = { "content-type": "application/json", "cache-control": "no-store" };

  const accessEmail = request.headers.get("Cf-Access-Authenticated-User-Email") || "";
  if (accessEmail) {
    const user = { id: accessEmail, email: accessEmail, role: "user", source: "access" };
    return new Response(JSON.stringify({ ok: true, user }), { status: 200, headers });
  }

  const cookies = parseCookies(request);
  const cookieEmail = cookies["bestie_email"];
  if (cookieEmail) {
    const user = { id: cookieEmail, email: cookieEmail, role: "user", source: "cookie" };
    return new Response(JSON.stringify({ ok: true, user }), { status: 200, headers });
  }

  return new Response(JSON.stringify({ ok: false }), { status: 401, headers });
}
export const onRequest = onRequestGet;