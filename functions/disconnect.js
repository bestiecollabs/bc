export async function onRequestGet() {
  const base = "Path=/; Domain=.bestiecollabs.com; Secure; SameSite=Lax";
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/signup/creator",
      "Set-Cookie": [
        "tik_ok=; Max-Age=0; " + base,
        "tik_name=; Max-Age=0; " + base,
        "tik_id=; Max-Age=0; " + base,
        "tik_state=; Max-Age=0; " + base + "; HttpOnly",
      ],
    },
  });
}
