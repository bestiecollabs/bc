export async function onRequestGet() {
  return new Response(null, {
    status: 302,
    headers: {
      "Location": "/",
      "Set-Cookie": "bestie_email=; Path=/; Max-Age=0; SameSite=Lax; Secure"
    }
  });
}
