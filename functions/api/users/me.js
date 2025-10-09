import { q } from "../admin/chipchip/_lib/db.js";

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > -1) {
      const k = part.slice(0, i).trim();
      const v = part.slice(i + 1).trim();
      try { out[k] = decodeURIComponent(v); } catch { out[k] = v; }
    }
  }
  return out;
}

async function findUser(env, key) {
  if (!key) return null;
  const sql = `SELECT id,email,username,role,full_name,created_at,updated_at
               FROM users WHERE lower(email)=lower(?) OR lower(username)=lower(?) LIMIT 1`;
  const r = await q(env.DB, sql, [key, key]);
  return r?.results?.[0] ?? null;
}

const H = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "private, no-store, max-age=0",
  "pragma": "no-cache"
};

export async function onRequest({ env, request }) {
  try {
    const cookies = parseCookies(request.headers.get("Cookie") || "");
    const key = cookies.bestie_email || cookies.user_email || cookies.email || "";
    const user = await findUser(env, key);
    if (!user) return new Response(JSON.stringify({ ok:false }), { status:401, headers:H });

    return new Response(JSON.stringify({ ok:true, user }), { status:200, headers:H });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:String(e?.message||e) }), { status:500, headers:H });
  }
}
