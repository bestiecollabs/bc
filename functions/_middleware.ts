export const onRequest = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);
  // Protect bam.html only
  if (url.pathname !== "/bam.html" && url.pathname !== "/bam") {
    return next();
  }
  const realm = "Restricted";
  const user = env.BAM_BASIC_USER;
  const pass = env.BAM_BASIC_PASS;

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
    decoded = atob(auth.replace("Basic ", ""));
  } catch {
    return unauthorized();
  }
  const [u, p] = decoded.split(":");
  if (u !== user || p !== pass) return unauthorized();

  return next();
};
