export async function onRequest({ request, next }) {
  const allowedOrigin = 'https://bestiecollabs.com';
  const origin = request.headers.get('Origin');
  const isPreflight = request.method === 'OPTIONS' &&
                      request.headers.get('Access-Control-Request-Method');

  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, x-admin-email',
    'Vary': 'Origin'
  });

  if (origin === allowedOrigin) {
    headers.set('Access-Control-Allow-Origin', allowedOrigin);
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  if (isPreflight) {
    return new Response(null, { status: 204, headers });
  }

  const resp = await next();
  headers.forEach((v, k) => resp.headers.set(k, v));
  return resp;
}
