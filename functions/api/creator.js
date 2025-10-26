export async function onRequestGet({ request, env }) {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return new Response(JSON.stringify({ ok:false, message:"missing id" }), { status:400 });
  const r = await env.DB.prepare(
    "SELECT open_id, display_name, avatar, role, connected_at FROM creators WHERE open_id = ?"
  ).bind(id).first();
  if (!r) return new Response(JSON.stringify({ ok:false, message:"not found" }), { status:404 });

  // placeholders until extended scopes (stats, IG) are approved
  const data = {
    open_id: r.open_id,
    display_name: r.display_name,
    avatar: r.avatar,
    role: r.role,
    since: r.connected_at,
    tiktok_connected: !!r.open_id,
    instagram_connected: false,
    tiktok_followers: null,
    tiktok_avg_views: null,
    tiktok_engagement: null,
    instagram_followers: null,
    category: null,
    location: null,
  };
  return new Response(JSON.stringify({ ok:true, creator: data }, null, 2), {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
