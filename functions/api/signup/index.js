// POST /api/signup
export const onRequestPost = async ({ request, env }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return j(400, { ok:false, message:"Invalid JSON." });
  }

  const email = String(body.email||"").trim().toLowerCase();
  const name  = String(body.name||"").trim();
  const usernameRaw = (body.username ?? email.split("@")[0] ?? "").toString();
  let username = usernameRaw.trim().toLowerCase().replace(/[^a-z0-9_.]/g, "_").slice(0,24);
  if (!username) username = "u_"+randHex(6);

  const pass = String(body.password||"");
  const confirm = String(body.confirmPassword||"");
  if (pass.length < 8) return j(400, { ok:false, field:"password", message:"Min 8 chars." });
  if (pass !== confirm) return j(400, { ok:false, field:"confirmPassword", message:"Passwords do not match." });

  const accept = !!body.acceptTerms;
  if (!accept) return j(400, { ok:false, field:"acceptTerms", message:"You must accept the terms." });

  // Default role to creator if missing or invalid
  const r = String(body.role||"creator");
  const role = (r === "brand" || r === "creator") ? r : "creator";

  // Map camelCase -> snake_case with default
  const terms_version = String(body.termsVersion || "v1");
  const accepted_terms_at = Math.floor(Date.now()/1000);

  // Hash password with PBKDF2
  const { hash, salt } = await hashPw(pass);

  const sql = `
    INSERT INTO users (email, username, full_name, role, phone, terms_version, accepted_terms_at, pw_salt, pw_hash)
    VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?);
  `;

  try {
    await env.DB.prepare(sql).bind(email, username, name, role, terms_version, accepted_terms_at, salt, hash).run();
    return j(200, { ok:true, next:"login", message:"Account created. Please sign in." });
  } catch (e) {
    const m = String(e && e.message || "");
    if (/UNIQUE constraint failed: users\.email/i.test(m)) {
      return j(409, { ok:false, field:"email", message:"Email already registered." });
    }
    if (/UNIQUE constraint failed: users\.username/i.test(m)) {
      // retry once with suffix
      const u2 = (username + "_" + randHex(2)).slice(0,28);
      try {
        await env.DB.prepare(sql).bind(email, u2, name, role, terms_version, accepted_terms_at, salt, hash).run();
        return j(200, { ok:true, next:"login", message:"Account created. Please sign in." });
      } catch (e2) {
        if (/UNIQUE constraint failed: users\.username/i.test(String(e2?.message||""))) {
          return j(409, { ok:false, field:"username", message:"Username is taken." });
        }
      }
    }
    return j(500, { ok:false, message:"Signup failed." });
  }
};

function j(status, obj){ return new Response(JSON.stringify(obj), { status, headers:{ "content-type":"application/json" } }); }

function randHex(nBytes){
  const b = new Uint8Array(nBytes);
  crypto.getRandomValues(b);
  return [...b].map(x=>x.toString(16).padStart(2,"0")).join("");
}

async function hashPw(password){
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), { name:"PBKDF2" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name:"PBKDF2", salt:saltBytes, iterations:100000, hash:"SHA-256" }, key, 256);
  const hashHex = [...new Uint8Array(bits)].map(b=>b.toString(16).padStart(2,"0")).join("");
  const saltHex = [...saltBytes].map(b=>b.toString(16).padStart(2,"0")).join("");
  return { hash: hashHex, salt: saltHex };
}
