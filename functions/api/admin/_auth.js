export function requireAdmin(request) {
  const email = String(request.headers.get("x-admin-email") || "").toLowerCase().trim();
  if (!email) return [null, {status:401, body:{ok:false,error:"missing_admin_email"}}];

  // Allow-list from env or default list
  const allowed = (ADMIN_ADMINS || "collabsbestie@gmail.com").split(",").map(s=>s.trim().toLowerCase());
  if (!allowed.includes(email)) return [null, {status:401, body:{ok:false,error:"not_allowed", email}}];

  return [email, null];
}