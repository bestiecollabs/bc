export const ACCEPTED_HEADERS_11 = [
  "brand_name","website_url",
  "category_primary","category_secondary","category_tertiary",
  "instagram_url","tiktok_url",
  "description","customer_age_min","customer_age_max","us_based"
];
export function validateHeaders(headerLine){
  const got = String(headerLine||"").replace(/\r/g,"").trim().split(",").map(s=>s.trim());
  const need = ACCEPTED_HEADERS_11;
  const missing = need.filter(h => !got.includes(h));
  const unexpected = got.filter(h => !need.includes(h));
  const ok = missing.length===0 && unexpected.length===0 && got.length===need.length;
  return { ok, missing, unexpected, expected: need };
}
