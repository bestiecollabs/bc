export const onRequest = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Optional masked debug to confirm env is present
  if (url.pathname === "/_debug-bam-auth") {
    const hasUser = typeof env.BAM_BASIC_USER === "string" && env.BAM_BASIC_USER.length > 0;
    const hasPass = typeof env.BAM_BASIC_PASS === "string" && env.BAM_BASIC_PASS.length > 0;
    return new Response(JSON.stringify({ env_ok: hasUser && hasPass, user_set: hasUser, pass_set: hasPass }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  // Protect only /bam.html and /bam
  if (url.pathname !== "/bam.html" && url.pathname !== "/bam") {
    return next();
  }

  const realm = "Restricted";
  const user = env.BAM_BASIC_USER;
  const pass = env.BAM_BASIC_PASS;

  if (!user || !pass) {
    return new Response("Server auth not configured", { status: 500 });
  }

  function unauthorized() {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": `Basic realm="${realm}", charset="UTF-8"` },
    });
  }

  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Basic ")) return unauthorized();

  let decoded;
  try {
    decoded = atob(auth.slice(6));
  } catch {
    return unauthorized();
  }

  const idx = decoded.indexOf(":");
  if (idx < 0) return unauthorized();
  const u = decoded.slice(0, idx);
  const p = decoded.slice(idx + 1); // allow colons in passwords

  if (u !== user || p !== pass) return unauthorized();

  return next();
};
