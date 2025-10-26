// POST /api/address/verify
// Body: { street, apt?, city, state, zip }
// Calls USPS OAuth (JSON) then GET /addresses/v3/address with query params.
// Env: USPS_CLIENT_ID, USPS_CLIENT_SECRET, USPS_OAUTH_URL, USPS_ADDR_URL

let TOKEN_CACHE = { token: null, exp: 0 };

async function getToken(env) {
  const now = Date.now();
  if (TOKEN_CACHE.token && TOKEN_CACHE.exp - now > 60_000) return TOKEN_CACHE.token;

  const oauthUrl = env.USPS_OAUTH_URL || 'https://apis.usps.com/oauth2/v3/token';
  const body = JSON.stringify({
    grant_type: 'client_credentials',
    client_id: env.USPS_CLIENT_ID,
    client_secret: env.USPS_CLIENT_SECRET,
  });

  const r = await fetch(oauthUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (!r.ok) throw new Error(`USPS OAuth ${r.status}: ${await r.text()}`);

  const j = await r.json();
  const ttlMs = (j.expires_in ? Number(j.expires_in) : 8 * 3600) * 1000;
  TOKEN_CACHE = { token: j.access_token, exp: Date.now() + ttlMs };
  return TOKEN_CACHE.token;
}

function json(body, status=200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const { street, apt = '', city, state, zip } = await request.json().catch(() => ({}));
    if (!street || !city || !state || !zip) {
      return json({ ok:false, error:'missing_fields', fields:{ street:!!street, city:!!city, state:!!state, zip:!!zip } }, 400);
    }

    const token = await getToken(env);

    const base = env.USPS_ADDR_URL || 'https://apis.usps.com/addresses/v3/address';
    const u = new URL(base);
    u.searchParams.set('streetAddress', street);
    if (apt) u.searchParams.set('secondaryAddress', apt);
    u.searchParams.set('city', city);
    u.searchParams.set('state', state);
    u.searchParams.set('ZIPCode', zip);

    const r = await fetch(u.toString(), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });

    const text = await r.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { /* leave null */ }

    if (!r.ok) return json({ ok:false, error:'usps_error', details: data || text }, r.status);

    // Normalize common fields (handle casing/shape variants)
    const addr = data?.address || data?.addresses?.[0]?.address || null;
    const info = data?.additionalInfo || data?.addresses?.[0]?.additionalInfo || null;

    const normalized = {
      streetAddress: addr?.streetAddress ?? addr?.addressLine1 ?? null,
      secondaryAddress: addr?.secondaryAddress ?? addr?.addressLine2 ?? null,
      city: addr?.city ?? null,
      state: addr?.state ?? null,
      zip5: addr?.ZIPCode ?? addr?.zipCode ?? addr?.zip5 ?? null,
      zip4: addr?.ZIPPlus4 ?? addr?.zipPlus4 ?? addr?.plus4Code ?? null,
      dpvConfirmation: info?.DPVConfirmation ?? info?.dpvConfirmation ?? null, // Y/N/S/D
      carrierRoute: info?.carrierRoute ?? null,
      deliveryPoint: info?.deliveryPoint ?? null,
      business: info?.business ?? null,
      vacant: info?.vacant ?? null,
    };

    return json({ ok:true, normalized, raw:data }, 200);
  } catch (err) {
    return json({ ok:false, error:'server_error', details:String(err?.message || err) }, 500);
  }
}
