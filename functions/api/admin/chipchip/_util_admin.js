export function getAdminEmail(request) {
  const h = request.headers;
  let email =
    h.get('cf-access-authenticated-user-email') ||
    h.get('cf-access-email') ||
    h.get('x-admin-email') ||
    '';
  email = (email || '').trim().toLowerCase();
  if (!email) {
    const cookie = h.get('cookie') || '';
    const m = cookie.match(/(?:^|;\s*)bestie_email=([^;]+)/i);
    if (m) email = decodeURIComponent(m[1]).trim().toLowerCase();
  }
  return email || null;
}
export function ensureAdminOrThrow(request, env) {
  const email = getAdminEmail(request);
  const allow = String(env.ADMIN_ALLOWLIST || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!email || !allow.includes(email)) { const err = new Error('unauthorized'); err.status = 401; throw err; }
  return email;
}
export function json(status, data, extraHeaders = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...extraHeaders } });
}
export function nowIso() { return new Date().toISOString(); }
export function uuid() { return crypto.randomUUID(); }
