export function assertAdmin(env, request) {
  const email =
    request.headers.get("Cf-Access-Authenticated-User-Email") ||
    request.headers.get("x-admin-email");
  if (!email) return null;
  const list = String(env.ADMIN_ALLOWLIST || "")
    .toLowerCase()
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  return list.includes(email.toLowerCase()) ? email : null;
}

export function json(data, status = 200, headers = {}) {
  const safeStatus = Number.isInteger(status) && status >= 200 && status <= 599 ? status : 500;
  return new Response(JSON.stringify(data ?? {}), {
    status: safeStatus,
    headers: { "content-type": "application/json; charset=utf-8", ...headers }
  });
}

export function notFound() {
  return new Response("Not found", { status: 404 });
}

// ---------- Safe D1 helpers ----------

export async function q(db, sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const bound = params && params.length ? stmt.bind(...params) : stmt;
    return await bound.all();
  } catch (e) {
    console.error("D1 q() error:", e);
    return { results: [], error: e.message };
  }
}

export async function run(db, sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const bound = params && params.length ? stmt.bind(...params) : stmt;
    return await bound.run();
  } catch (e) {
    console.error("D1 run() error:", e);
    return { success: false, error: e.message };
  }
}

export function nowSec() {
  return Math.floor(Date.now() / 1000);
}

export function ulid() {
  const t = Date.now().toString(36);
  const r = Array.from({ length: 16 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
  return (t + r).slice(0, 26);
}

export function csvResponse(name, header, rows) {
  const esc = v => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header.join(","), ...rows.map(r => r.map(esc).join(","))].join("\n");
  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${name}"`
    }
  });
}

export async function getByIds(db, table, ids) {
  if (!ids?.length) return [];
  const qMarks = ids.map(() => "?").join(",");
  const res = await q(db, `SELECT * FROM ${table} WHERE id IN (${qMarks})`, ids);
  return res?.results ?? [];
}

// Normalizers
export function normalizeWebsite(input) {
  if (!input) return "";
  let s = String(input).trim();
  s = s.replace(/^mailto:/i, "").replace(/^tel:/i, "");
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    u.hostname = u.hostname.toLowerCase();
    if (!u.pathname || u.pathname === "/") u.pathname = "";
    u.hash = "";
    u.search = "";
    let out = u.toString();
    if (out.endsWith("/") && u.pathname === "") out = out.slice(0, -1);
    return out;
  } catch {
    return s;
  }
}

export function makePublicCode(name, opts = {}) {
  const minLen = opts.minLen ?? 3;
  const base = String(name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const slug = base.length >= minLen ? base : "id-" + Math.random().toString(36).slice(2, 8);
  return slug.slice(0, 64);
}