export async function onRequest({ request }) {
  const u = new URL(request.url);
  const email = (u.searchParams.get("email") || "").trim().toLowerCase();
  const next = u.searchParams.get("next") || "/";
  if (!email) return Response.redirect(new URL("/login/?error=missing_email", request.url), 302);

  const base = `bestie_email=\${encodeURIComponent(email)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure; HttpOnly`;
  const headers = new Headers();
  headers.append("Set-Cookie", base);
  if (u.hostname.endsWith("bestiecollabs.com")) {
    headers.append("Set-Cookie", base + "; Domain=bestiecollabs.com");
  }
  headers.set("Location", next);
  return new Response(null, { status: 302, headers });
}
