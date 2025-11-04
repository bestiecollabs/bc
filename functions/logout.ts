// GET /logout
// Clears __Secure-bc_session then redirects to home. Works without JS.
export const onRequest: PagesFunction = async () => {
  const h = new Headers({ "Location": "/" });
  // Clear parent-domain cookie so apex and subdomains drop session
  h.append("Set-Cookie",
    "__Secure-bc_session=; Path=/; Domain=bestiecollabs.com; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  // Also clear any host-only cookie defensively
  h.append("Set-Cookie",
    "__Secure-bc_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  h.set("Cache-Control","no-store");
  return new Response(null, { status: 303, headers: h }); // 303 avoids resubmits
};
