import { assertAdmin, json, notFound, q } from "./chipchip/_lib/db.js";

export async function onRequest({ env, request }) {
  const email = assertAdmin(env, request);
  if (!email) return notFound();
  try {
    const res = await q(env.DB, "SELECT 1 AS ok");
    return json({ ok: true, db: res.results });
  } catch (e) {
    return json({ ok: false, error: e.message });
  }
}

