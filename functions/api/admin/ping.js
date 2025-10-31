export const onRequestGet = async () => {
  return new Response(JSON.stringify({ ok: true, ping: "admin" }), {
    headers: { "content-type": "application/json" }
  });
};
