import { json, q } from "../admin/chipchip/_lib/db.js";

const getCookie = (req,n)=>{ const m=(req.headers.get("Cookie")||"").match(new RegExp("(?:^|;\\s*)"+n+"=([^;]+)","i")); return m?decodeURIComponent(m[1]):null; };

async function findUser(env,email){
  const r = await q(env.DB, `SELECT id,email,username,full_name,role,phone,shop_name,is_shopify_store,tiktok_user_id,instagram_user_id
                              FROM users WHERE lower(email)=lower(?) LIMIT 1`, [email]);
  return r?.results?.[0] || null;
}

async function ensureUser(env,email){
  const u = await findUser(env,email);
  if (u) return u;
  const username = email.split("@")[0].slice(0,40);
  await q(env.DB, `INSERT INTO users (email, username, full_name, role) VALUES (?, ?, ?, 'brand')`, [email, username, ""]);
  return await findUser(env,email);
}

export async function onRequest({ env, request }) {
  const email =
    getCookie(request,"bestie_email") ||
    getCookie(request,"user_email") ||
    getCookie(request,"email");

  if (!email) return json({ ok:false }, 401);

  const u = await ensureUser(env, email.toLowerCase());
  return u ? json({ ok:true, user:u, address:null }) : json({ ok:false }, 401);
}
