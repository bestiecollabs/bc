export const onRequest: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const access = ctx.request.headers.get("CF-Access-Jwt-Assertion");
  if (!access) return new Response("Unauthorized", { status: 401 });

  if (ctx.request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET" } });
  }

  return new Response(JSON.stringify({ ok: true, route: "/api/admin/users", items: [] }), {
    headers: { "Content-Type": "application/json" },
  });
};
