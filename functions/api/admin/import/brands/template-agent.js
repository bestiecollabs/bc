export async function onRequestGet() {
  const headers = [
    "brand_name","website_url",
    "category_primary","category_secondary","category_tertiary",
    "instagram_url","tiktok_url","logo_url",
    "description","us_based","contact_email",
    "customer_age_min","customer_age_max",
    "price_low","price_high",
    "has_affiliate_program","monthly_visits",
    "customer_locations","source_url","discovered_at","discovered_by",
    "notes_admin"
  ].join(",");
  return new Response(headers + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=brands_template_agent.csv"
    }
  });
}
