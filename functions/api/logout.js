export async function onRequestPost({ request }) {
  const raw = request.headers.get("cookie") || "";
  const names = [...new Set(raw.split(";").map(p => p.split("=")[0].trim()).filter(Boolean))];
  const fallback = ["sid","session","sess","auth","token","bestie_sid","bestie_email"];
  const all = names.length ? names : fallback;
  const headers = new Headers();
  for (const n of all) headers.append("Set-Cookie", `${n}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  headers.set("cache-control", "no-store");
  return new Response("", { status: 204, headers });
}
