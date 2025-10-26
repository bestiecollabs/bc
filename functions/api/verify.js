// US-only stub verifier. Adds ZIP+4, flags apt_required for multi-unit hints.
// Replace with USPS/Lob later.
const STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
]);

function needsApt(street) {
  return /\b(apt|unit|suite|ste|#)\b/i.test(street || "");
}

function toZip9(zip, seed) {
  // normalize to 5 or 9; produce deterministic last4 when only 5 given
  const m9 = String(zip||"").replace(/\D/g,"");
  if (m9.length >= 9) return m9.slice(0,5) + "-" + m9.slice(5,9);
  // simple djb2 hash for stable last4
  let h = 5381;
  for (const ch of String(seed||"")) h = ((h << 5) + h) + ch.charCodeAt(0);
  const last4 = String(Math.abs(h)%10000).padStart(4,"0");
  return String(zip).slice(0,5) + "-" + last4;
}

export async function onRequestPost({ request }) {
  const a = await request.json().catch(() => ({}));
  const street = String(a.street||"").trim();
  const apt    = String(a.apt||"").trim();
  const city   = String(a.city||"").trim();
  const state  = String(a.state||"").trim().toUpperCase();
  const zipRaw = String(a.zip||"").trim();

  const issues = [];

  if (!street) issues.push("missing_street");
  if (!city) issues.push("missing_city");
  if (!state || !STATES.has(state)) issues.push("bad_state");
  if (!/^\d{5}(-?\d{4})?$/.test(zipRaw)) issues.push("bad_zip");

  if (needsApt(street) && !apt) issues.push("apt_required");

  const ok = issues.length === 0;
  const zip9 = ok ? toZip9(zipRaw, `${street}|${city}|${state}`) : null;

  return new Response(JSON.stringify({ ok, normalized:{ street, apt, city, state, zip: zip9||zipRaw }, zip9, issues }), {
    headers: { "Content-Type": "application/json" }
  });
}
