export async function onRequestGet() {
  return new Response(JSON.stringify({
    ok:false,
    message:"Instagram connect is not enabled yet."
  }, null, 2), { status:501, headers:{ "content-type":"application/json" }});
}
