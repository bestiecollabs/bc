export async function onRequestGet({ request }) {
  // Expire every cookie name present on the request
  const raw = request.headers.get("Cookie") || "";
  const names = [...new Set(raw.split(";").map(p => p.split("=")[0].trim()).filter(Boolean))];
  const fallback = ["sid","session","sess","auth","token","bestie_sid"];
  const all = names.length ? names : fallback;

  const headers = new Headers();
  for (const n of all) {
    headers.append("Set-Cookie", `${n}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  }
  headers.set("Cache-Control", "no-store");
  headers.set("Location", "/?loggedout=1&_=" + Date.now());

  return new Response(null, { status: 302, headers });
}
