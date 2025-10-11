export async function onRequestPost() {
  const headers = new Headers({
    "content-type": "application/json",
    "cache-control": "no-store",
  });

  // Expire on apex and subdomain scopes
  const expired = "bestie_email=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Lax";
  headers.append("Set-Cookie", expired + "; HttpOnly");
  headers.append("Set-Cookie", expired + "; Domain=.bestiecollabs.com; HttpOnly");

  return new Response(JSON.stringify({ ok: true, cleared: "bestie_email" }), { status: 200, headers });
}
export const onRequest = onRequestPost;