export async function onRequestGet({ env }) {
  const { results } = await env.DB
    .prepare("SELECT open_id, display_name, avatar, connected_at FROM creators ORDER BY connected_at DESC LIMIT 200")
    .all();
  const creators = (results || []).map(r => ({
    open_id: r.open_id,
    display_name: r.display_name,
    avatar: r.avatar,
    since: r.connected_at,
    tiktok_connected: !!r.open_id,
    instagram_connected: false, // scaffold until IG is built
  }));
  return new Response(JSON.stringify({ creators }, null, 2), {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
