function parseCookies(req) {
  const raw = req.headers.get("cookie") || "";
  const out = {};
  raw.split(";").forEach(kv => {
    const i = kv.indexOf("="); if (i > -1) out[kv.slice(0,i).trim()] = decodeURIComponent(kv.slice(i+1).trim());
  });
  return out;
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const debug = url.searchParams.get("debug") === "1";
  const headers = { "content-type": "application/json", "cache-control": "no-store" };

  // 1) Cloudflare Access
  const accessEmail = request.headers.get("Cf-Access-Authenticated-User-Email") || "";
  if (accessEmail) {
    const user = { id: accessEmail, email: accessEmail, role: "user", source: "access" };
    return new Response(JSON.stringify({ ok: true, user }), { status: 200, headers });
  }

  // 2) Cookie fallback
  const cookies = parseCookies(request);
  const cookieEmail = cookies["bestie_email"];
  if (cookieEmail) {
    const user = { id: cookieEmail, email: cookieEmail, role: "user", source: "cookie" };
    return new Response(JSON.stringify({ ok: true, user }), { status: 200, headers });
  }

  // Debug payload always 200 to ensure body is visible
  if (debug) {
    const hdrs = {};
    for (const [k,v] of request.headers) {
      if (k.toLowerCase().startsWith("cf-") || k.toLowerCase()==="cookie") hdrs[k]=v;
    }
    return new Response(JSON.stringify({ ok:false, why:"no_identity", seen_headers:hdrs, parsed_cookies:cookies }), { status: 200, headers });
  }

  return new Response(JSON.stringify({ ok: false }), { status: 401, headers });
}

export const onRequest = onRequestGet;