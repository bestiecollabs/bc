export async function onRequestGet({ request, env }) {
  const email = String(request.headers.get("x-admin-email")||"").toLowerCase().trim();
  if (!email) return new Response(JSON.stringify({ok:false,error:"missing_admin_email"}), {status:401, headers:{'content-type':'application/json'}});
  // TODO: put a real allow-list in env.ADMIN_ADMINS
  const allowed = (env.ADMIN_ADMINS || "collabsbestie@gmail.com").toLowerCase();
  if (!allowed.split(",").map(s=>s.trim()).includes(email)) {
    return new Response(JSON.stringify({ok:false,error:"not_allowed", email}), {status:401, headers:{'content-type':'application/json'}});
  }

  // existing logic to read brands; fallback to empty list
  const rows = []; // replace with your datastore read
  return new Response(JSON.stringify({ok:true, rows}), {headers:{'content-type':'application/json'}});
}