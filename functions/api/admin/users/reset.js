// POST { email, newPassword }
import { requireAccess } from "../_lib/access.js";

export const onRequestPost = async ({ request, env }) => {
  const deny = requireAccess(request); if (deny) return deny;
  let b; try { b = await request.json(); } catch { return j(400, { ok:false, message:"Invalid JSON" }); }
  const email = String(b.email||"").trim().toLowerCase();
  const newPassword = String(b.newPassword||"");
  if (!email || newPassword.length < 8) return j(400, { ok:false, message:"email and min 8-char newPassword required" });

  const { hash, salt } = await hashPw(newPassword);
  const sql = "UPDATE users SET pw_hash = ?, pw_salt = ?, updated_at = unixepoch() WHERE email = ?;";
  const r = await env.DB.prepare(sql).bind(hash, salt, email).run();
  return j(200, { ok:true, updated: r.meta?.changes ?? 0 });
};

function j(status, obj){ return new Response(JSON.stringify(obj), { status, headers:{ "content-type":"application/json" } }); }

async function hashPw(password){
  const saltBytes = new Uint8Array(16); crypto.getRandomValues(saltBytes);
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), { name:"PBKDF2" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name:"PBKDF2", salt:saltBytes, iterations:100000, hash:"SHA-256" }, key, 256);
  const hashHex = [...new Uint8Array(bits)].map(b=>b.toString(16).padStart(2,"0")).join("");
  const saltHex = [...saltBytes].map(b=>b.toString(16).padStart(2,"0")).join("");
  return { hash: hashHex, salt: saltHex };
}
