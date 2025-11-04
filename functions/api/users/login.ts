// Login endpoint for POST /api/users/login
// Verifies credentials (stub here), sets a session cookie for .bestiecollabs.com
export const onRequestPost: PagesFunction = async ({ request, env }) => {
  try {
    const { email, password } = await request.json<any>();
    // TODO: replace this with your real auth check against D1 or external auth
    if (!email || !password) {
      return new Response(JSON.stringify({ ok:false, error:"missing credentials" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Example auth gate. Replace with real validation.
    // Throw 401 on bad password to avoid setting a cookie.
    const ok = typeof password === "string" && password.length >= 8;
    if (!ok) {
      return new Response(JSON.stringify({ ok:false, error:"invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Create or fetch a real session token here
    const token = btoa(`${email}:${Date.now()}`);

    const h = new Headers({ "Content-Type": "application/json" });
    // Important: use append for Set-Cookie; include Domain=.bestiecollabs.com so apex and api share it
    h.append("Set-Cookie",
      `__Secure-bc_session=${encodeURIComponent(token)}; Path=/; Domain=.bestiecollabs.com; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
    // Avoid caching auth responses so Set-Cookie is preserved
    h.set("Cache-Control", "no-store");

    return new Response(JSON.stringify({ ok:true }), { status: 200, headers: h });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:"bad request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
};
