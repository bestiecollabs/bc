export async function onRequestGet() {
  const headers = [
    "name","website_url",
    "category_primary","category_secondary","category_tertiary",
    "instagram_url","tiktok_url","logo_url","featured","description",
    "country","state","city","zipcode","address",
    "contact_name","contact_title","contact_email","contact_phone",
    "customer_age_min","customer_age_max",
    "price_low","price_high",
    "affiliate_program","affiliate_cookie_days",
    "monthly_visits","brand_values","gifting_ok",
    "shopify_shop_id","shopify_public_url","shopify_shop_domain",
    "notes_admin"
  ].join(",");
  return new Response(headers+"\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=brands_template.csv"
    }
  });
}
