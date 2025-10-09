export async function onRequestPost({ request }) {
  // Expire every cookie name present on the request.
  const raw = request.headers.get("Cookie") || "";
  const names = [...new Set(
    raw.split(";").map(p => p.split("=")[0].trim()).filter(Boolean)
  )];

  const headers = new Headers();
  // If no cookies detected, still try common names.
  const fallback = ["sid","session","sess","auth","token","bestie_sid"];
  const all = names.length ? names : fallback;

  for (const n of all) {
    headers.append("Set-Cookie", `${n}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  }
  headers.set("Cache-Control", "no-store");

  return new Response("", { status: 204, headers });
}
