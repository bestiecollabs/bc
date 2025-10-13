import { assertAdmin } from "../api/admin/chipchip/_lib/db.js";

export async function onRequest(context) {
  const { request } = context;
  const email = assertAdmin(context.env, request);
  if (email) {
    const to = new URL("/admin/dashboard/", request.url);
    return Response.redirect(to, 302);
  }
  // Non-admins fall through to the static /account page
  return context.next();
}
