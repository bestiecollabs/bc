export async function onRequestGet(context) {
  const { env } = context;
  const val = env.ADMIN_ALLOWLIST || "";
  const summary = { ok:true, has: !!val, length: val.length, sample: val.slice(0, 5) };
  return new Response(JSON.stringify(summary), { status: 200, headers: { "content-type":"application/json" }});
}
