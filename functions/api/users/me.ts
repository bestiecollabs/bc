// GET /api/users/me
// Reads __Secure-bc_session from Cookie. If present, treat as logged in.
export const onRequestGet: PagesFunction = async ({ request }) => {
  const cookie = request.headers.get("Cookie") || "";
  const name = "__Secure-bc_session=";
  const start = cookie.indexOf(name);
  if (start === -1) {
    return new Response(JSON.stringify({ ok:false }), {
      status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
  }
  const val = cookie.slice(start + name.length).split(";")[0] || "";
  try {
    const decoded = atob(decodeURIComponent(val));
    const email = decoded.split(":")[0] || "";
    return new Response(JSON.stringify({ ok:true, user:{ email } }), {
      status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
  } catch {
    return new Response(JSON.stringify({ ok:false }), {
      status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
  }
};
