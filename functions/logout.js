export async function onRequestGet() {
  const html = `<!doctype html><meta charset="utf-8">
<script>
try {
  // Extra safety: clear any client state
  localStorage.clear(); sessionStorage.clear();
  // Nuke cookie on both host scopes from client too
  var past="Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie="bestie_email=; Path=/; Expires="+past+"; Secure; SameSite=Lax";
  document.cookie="bestie_email=; Domain=.bestiecollabs.com; Path=/; Expires="+past+"; Secure; SameSite=Lax";
} catch(e){}
location.replace("/");
</script>`;
  return new Response(html, { headers: { "content-type":"text/html; charset=utf-8", "cache-control":"no-store" } });
}
export const onRequest = onRequestGet;