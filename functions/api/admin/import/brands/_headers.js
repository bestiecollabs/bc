export const ACCEPTED_HEADERS_11 = [
  "brand_name","website_url",
  "category_primary","category_secondary","category_tertiary",
  "instagram_url","tiktok_url",
  "description","customer_age_min","customer_age_max","us_based"
];

// cols is an array of header strings as parsed from first CSV line
export function validateHeaderList(cols){
  const got = (cols || []).map(s => String(s || "").trim());
  const need = ACCEPTED_HEADERS_11;
  const missing = need.filter(h => !got.includes(h));
  const extras  = got.filter(h => !need.includes(h));
  const ok = missing.length === 0 && extras.length === 0 && got.length === need.length;
  return { ok, missing, extras, got, expected: need };
}