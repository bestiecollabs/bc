import { z } from "zod";

const Body = z.object({
  email: z.string().email(),
  username: z.string().min(1).optional(),
  name: z.string().min(1),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  role: z.enum(["brand","creator"]).default("creator").optional(),
  acceptTerms: z.boolean(),
  termsVersion: z.string().optional(),
});

type Env = { DB: D1Database };

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json(400, { ok: false, message: "Invalid JSON." });
  }

  const b = Body.safeParse(raw);
  if (!b.success) {
    return json(400, { ok: false, message: "Invalid body.", issues: b.error.issues });
  }
  const v = b.data;

  if (v.password !== v.confirmPassword) {
    return json(400, { ok: false, field: "confirmPassword", message: "Passwords do not match." });
  }
  if (!v.acceptTerms) {
    return json(400, { ok: false, field: "acceptTerms", message: "You must accept the terms." });
  }

  const email = v.email.trim().toLowerCase();
  const role = (v.role ?? "creator");
  const terms_version = v.termsVersion ?? "v1";
  const accepted_terms_at = Math.floor(Date.now() / 1000);
  const full_name = v.name.trim();

  let username = (v.username ?? email.split("@")[0]).trim().toLowerCase();
  username = username.replace(/[^a-z0-9_\.]/g, "_").slice(0, 24);
  if (!username) username = "u_" + cryptoRandomHex(6);

  const { hash, salt } = await hashPw(v.password);

  const stmt = `
    INSERT INTO users (email, username, full_name, role, phone, terms_version, accepted_terms_at, pw_salt, pw_hash)
    VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?);
  `;

  try {
    await env.DB.prepare(stmt).bind(email, username, full_name, role, terms_version, accepted_terms_at, salt, hash).run();
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    if (/UNIQUE constraint failed: users\.email/i.test(msg)) {
      return json(409, { ok: false, field: "email", message: "Email already registered." });
    }
    if (/UNIQUE constraint failed: users\.username/i.test(msg)) {
      // Retry once with a suffix to avoid client round-trip.
      const u2 = (username + "_" + cryptoRandomHex(2)).slice(0, 28);
      try {
        await env.DB.prepare(stmt).bind(email, u2, full_name, role, terms_version, accepted_terms_at, salt, hash).run();
      } catch (e2: any) {
        if (/UNIQUE constraint failed: users\.username/i.test(String(e2?.message ?? ""))) {
          return json(409, { ok: false, field: "username", message: "Username is taken." });
        }
        return json(500, { ok: false, message: "Signup failed." });
      }
      return json(200, { ok: true, next: "login", message: "Account created. Please sign in." });
    }
    return json(500, { ok: false, message: "Signup failed." });
  }

  return json(200, { ok: true, next: "login", message: "Account created. Please sign in." });
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function cryptoRandomHex(bytes: number): string {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return [...b].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function hashPw(password: string): Promise<{ hash: string; salt: string }> {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: 100_000, hash: "SHA-256" },
    key,
    256
  );
  const hashHex = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, "0")).join("");
  const saltHex = [...saltBytes].map(b => b.toString(16).padStart(2, "0")).join("");
  return { hash: hashHex, salt: saltHex };
}
