import { assertAdmin, json } from "./_lib/db.js";

export async function onRequest({ env, request }) {
  const email = assertAdmin(env, request);
  if (!email) return json({ ok: false }, 401);
  return json({ ok: true, user: { email, role: "admin" } });
}
