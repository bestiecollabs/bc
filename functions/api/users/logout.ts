// POST /api/users/logout
// Clears the __Secure-bc_session cookie for parent domain and any host-only cookie.
// Returns JSON, no redirects.
export const onRequestPost: PagesFunction = async () => {
  const h = new Headers({ "Content-Type": "application/json" });

  // Expire cookie for parent domain so apex + subdomains lose the session
  h.append("Set-Cookie",
    "__Secure-bc_session=; Path=/; Domain=bestiecollabs.com; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT");

  // Also expire any host-only cookie on this host defensively
  h.append("Set-Cookie",
    "__Secure-bc_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT");

  h.set("Cache-Control", "no-store");
  return new Response(JSON.stringify({ ok:true }), { status: 200, headers: h });
};
