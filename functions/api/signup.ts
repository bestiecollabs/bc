export interface Env { DB: D1Database; }

type Body = { email?: string; password?: string; role?: "brand"|"creator" };

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    const { email, password, role } = (await request.json()) as Body;

    if (!email || !password || !role || !/^(brand|creator)$/.test(role)) {
      return json({ error: "email, password, role required" }, 400);
    }
    if (password.length < 8) {
      return json({ error: "password too short" }, 400);
    }

    // Create table and index if missing
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('brand','creator')),
        is_admin INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      );
      CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email_ci ON users(lower(email));
    `);

    // Hash password with PBKDF2
    const { hashHex, saltHex } = await pbkdf2Hash(password);

    // Insert
    const id = crypto.randomUUID();
    try {
      await env.DB
        .prepare("INSERT INTO users (id,email,password_hash,password_salt,role) VALUES (?,?,?,?,?)")
        .bind(id, email.trim().toLowerCase(), hashHex, saltHex, role)
        .run();
    } catch (e:any) {
      // Constraint: unique email
      if (String(e?.message || "").includes("UNIQUE")) {
        return json({ error: "email already exists" }, 409);
      }
      throw e;
    }

    return json({ ok: true, id }, 201);
  } catch (err:any) {
    return json({ error: "invalid request" }, 400);
  }
};

// Utilities

async function pbkdf2Hash(password: string) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    key,
    256
  );
  const hashHex = toHex(new Uint8Array(bits));
  const saltHex = toHex(salt);
  return { hashHex, saltHex };
}

function toHex(arr: Uint8Array) {
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
