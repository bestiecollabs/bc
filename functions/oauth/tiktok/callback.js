async function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);

    // If TikTok sent an error, show it and stop.
    const err = url.searchParams.get("error");
    if (err) {
      return json({
        ok: false,
        source: "tiktok",
        error: err,
        error_description: url.searchParams.get("error_description"),
        log_id: url.searchParams.get("log_id"),
        state: url.searchParams.get("state"),
      }, 400);
    }

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) return json({ ok:false, message:"Missing code/state" }, 400);

    // Verify CSRF cookie
    const cookie = request.headers.get("cookie") || "";
    const match = cookie.match(/(?:^|;\s*)tik_state=([^;]+)/);
    if (!match || match[1] !== state) return json({ ok:false, message:"State mismatch" }, 400);

    const origin = url.origin;
    const redirectUri = (env.TIKTOK_REDIRECT_URI && env.TIKTOK_REDIRECT_URI.trim())
      ? env.TIKTOK_REDIRECT_URI
      : `${origin}/oauth/tiktok/callback`;

    // Exchange code -> token
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: env.TIKTOK_CLIENT_KEY || "",
        client_secret: env.TIKTOK_CLIENT_SECRET || "",
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });
    const tokenText = await tokenRes.text();
    let token; try { token = JSON.parse(tokenText); } catch { token = null; }
    if (!tokenRes.ok || !token || !token.access_token) {
      return json({ ok:false, message:"Token exchange failed", status: tokenRes.status, body: tokenText }, 502);
    }

    // Fetch profile (requires user.info.basic)
    const infoRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
      { headers: { Authorization: `Bearer ${token.access_token}` } }
    );
    const infoText = await infoRes.text();
    let info; try { info = JSON.parse(infoText); } catch { info = null; }
    const u = info?.data?.user || {};
    const open_id = u.open_id || "";
    const display_name = u.display_name || "TikTok user";
    const avatar = u.avatar_url || "";

    // Save to D1 (best effort)
    if (env.DB && open_id) {
      try {
        await env.DB.prepare(
          "INSERT OR REPLACE INTO creators (open_id, display_name, avatar, role, connected_at) VALUES (?, ?, ?, ?, ?)"
        ).bind(open_id, display_name, avatar, "creator", Date.now()).run();
      } catch { /* ignore DB errors */ }
    }

    // Redirect via HTML and set cookies using multiple headers
    const dest = new URL("/creators/profile/", origin);
    if (open_id) dest.searchParams.set("id", open_id);

    const base = "Path=/; Domain=.bestiecollabs.com; Secure; SameSite=Lax";
    const headers = new Headers({ "content-type": "text/html; charset=utf-8" });
    headers.append("Set-Cookie", "tik_state=; Max-Age=0; " + base + "; HttpOnly");
    headers.append("Set-Cookie", "tik_ok=1; Max-Age=2592000; " + base);
    headers.append("Set-Cookie", "tik_name=" + encodeURIComponent(display_name) + "; Max-Age=2592000; " + base);
    headers.append("Set-Cookie", "tik_id=" + encodeURIComponent(open_id) + "; Max-Age=2592000; " + base);

    const html =
      "<!doctype html><meta charset='utf-8'><title>Redirecting</title>" +
      "<script>location.replace(" + JSON.stringify(dest.toString()) + ");</script>" +
      "<noscript><a href='" + dest.toString().replace(/'/g, "%27") + "'>Continue</a></noscript>";

    return new Response(html, { status: 200, headers });
  } catch (e) {
    return json({ ok:false, message:"Worker error", detail: String(e) }, 500);
  }
}
