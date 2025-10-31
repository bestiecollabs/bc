export const onRequest: PagesFunction = async ({ request }) => {
  const ok = !!(request.headers.get("CF-Access-Jwt-Assertion")
             || request.headers.get("CF-Access-Client-Id"));
  if (!ok) return new Response(JSON.stringify({ error:"unauthorized" }), {
    status: 401, headers: { "content-type":"application/json" }
  });
  return new Response(JSON.stringify({ ok:true, placeholder:true }), {
    headers: { "content-type":"application/json" }
  });
};
