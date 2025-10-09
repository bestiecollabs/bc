export async function onRequest(ctx) {
  const { request } = ctx;
  const u = new URL(request.url);

  // Accept both POST JSON and GET query
  let email = (u.searchParams.get("email") || "").trim().toLowerCase();
  let next = (u.searchParams.get("next") || "/").trim();

  if (!email && request.method === "POST") {
    try {
      const body = await request.json();
      email = String(body?.email || "").trim().toLowerCase();
      if (body?.next) next = String(body.next).trim();
    } catch { /* ignore */ }
  }

  if (!email) {
    return Response.redirect(new URL("/login/?error=missing_email", request.url), 302);
  }

  const base = `bestie_email=${encodeURIComponent(email)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure; HttpOnly`;
  const headers = new Headers();
  headers.append("Set-Cookie", base);
  if (u.hostname.endsWith("bestiecollabs.com")) {
    headers.append("Set-Cookie", base + "; Domain=bestiecollabs.com");
  }
  headers.set("Cache-Control", "no-store");
  headers.set("Location", next || "/");

  // Always 302 so browsers don’t cache HTML here
  return new Response(null, { status: 302, headers });
}
