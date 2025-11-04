// POST /api/users/signup
// Stub: accept payload and respond 201 so the client proceeds to login.
// Replace TODO block with real persistence later.
export const onRequestPost: PagesFunction = async ({ request }) => {
  try {
    const body = await request.json<any>();
    if (!body?.email || !body?.password) {
      return new Response(JSON.stringify({ ok:false, error:"missing fields" }), {
        status: 400, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
      });
    }
    // TODO: write user to DB here and return 409 if email exists.
    return new Response(JSON.stringify({ ok:true }), {
      status: 201, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
  } catch {
    return new Response(JSON.stringify({ ok:false, error:"bad request" }), {
      status: 400, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    });
  }
};
