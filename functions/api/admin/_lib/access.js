export function requireAccess(request){
  const jwt = request.headers.get("CF-Access-Jwt-Assertion");
  if (!jwt) return new Response(JSON.stringify({ ok:false, message:"Unauthorized" }), { status: 401, headers: { "content-type":"application/json" } });
  return null;
}
