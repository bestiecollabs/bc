export async function onRequestGet() {
  const headers = [
    "brand_name","website_url",
    "category_primary","category_secondary","category_tertiary",
    "instagram_url","tiktok_url",
    "description",
    "customer_age_min","customer_age_max",
    "us_based"
  ].join(",");
  return new Response(headers + "\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=brands_template.csv"
    }
  });
}
