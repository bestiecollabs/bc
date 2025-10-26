export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const role = url.searchParams.get("role") || "creator";
  const state = `${crypto.randomUUID()}:${role}`;
  const redirectUri = env.TIKTOK_REDIRECT_URI || `${url.origin}/oauth/tiktok/callback`;

  const auth = new URL("https://www.tiktok.com/v2/auth/authorize/");
  auth.searchParams.set("client_key", env.TIKTOK_CLIENT_KEY);
  auth.searchParams.set("scope", "user.info.basic");
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: auth.toString(),
      "Set-Cookie": `tik_state=${state}; Path=/; Domain=.bestiecollabs.com; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}
