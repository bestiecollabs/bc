export async function onRequest(context) {
  // Pass through to static asset or route first
  const res = await context.next();

  // If HTML, ensure charset on Content-Type
  const ct = res.headers.get("content-type") || "";
  if (ct.startsWith("text/html") && !/charset=/i.test(ct)) {
    const hdrs = new Headers(res.headers);
    hdrs.set("content-type", "text/html; charset=utf-8");
    return new Response(res.body, { status: res.status, headers: hdrs });
  }

  return res;
}