export async function onRequest({ request }) {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const ct = request.headers.get("content-type") || "";
  let email = "";
  if (ct.includes("application/json")) { try { email = String((await request.json()).email||""); } catch {} }
  else { try { email = String((await request.formData()).get("email")||""); } catch {} }
  email = email.trim().toLowerCase();

  const u = new URL(request.url);
  const next = u.searchParams.get("next") || "/";

  if (!email) return Response.redirect(new URL("/login/?error=missing_email", request.url), 302);

  const base = `bestie_email=\${encodeURIComponent(email)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure; HttpOnly`;
  const headers = new Headers();
  headers.append("Set-Cookie", base);                         // host-only cookie
  if (u.hostname.endsWith("bestiecollabs.com")) {             // apex cookie for apex+www
    headers.append("Set-Cookie", base + "; Domain=bestiecollabs.com");
  }
  headers.set("Location", next);
  return new Response(null, { status: 302, headers });
}
