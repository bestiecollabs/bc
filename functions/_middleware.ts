export const onRequestOptions: PagesFunction = async ({ request }) => {
  const origin = request.headers.get("Origin") || "";
  const allowed = new Set([
    "https://bestiecollabs.com",
    "https://api.bestiecollabs.com",
    "http://localhost:8788"
  ]);

  const h = new Headers({
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin"
  });

  if (allowed.has(origin)) h.set("Access-Control-Allow-Origin", origin);
  return new Response(null, { status: 204, headers: h });
};

export const onRequest: PagesFunction = async (ctx) => {
  const res = await ctx.next();

  const origin = ctx.request.headers.get("Origin") || "";
  const allowed = new Set([
    "https://bestiecollabs.com",
    "https://api.bestiecollabs.com",
    "http://localhost:8788"
  ]);

  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Credentials", "true");
  if (allowed.has(origin)) h.set("Access-Control-Allow-Origin", origin);
  h.append("Vary", "Origin");

  // Do not cache auth responses so Set-Cookie is preserved
  const url = new URL(ctx.request.url);
  if (url.pathname.startsWith("/api/users/login") || url.pathname.startsWith("/api/users/signup")) {
    h.set("Cache-Control", "no-store");
  }

  return new Response(res.body, { status: res.status, headers: h });
};
