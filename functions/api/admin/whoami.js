import { getAdminEmail, json } from './chipchip/_util_admin.js';
export async function onRequestGet(context) {
  const { request, env } = context;
  const email = getAdminEmail(request);
  const allow = String(env.ADMIN_ALLOWLIST || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const allowed = email ? allow.includes(email.toLowerCase()) : false;
  return json(200, { ok: true, email, allowed, allow_count: allow.length });
}
