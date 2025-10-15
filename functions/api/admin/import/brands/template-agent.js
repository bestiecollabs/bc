export async function onRequestGet() {
  const headers = ['brand_name','website_url','category_primary','category_secondary','category_tertiary','instagram_url','tiktok_url','description','customer_age_min','customer_age_max','us_based'];
  const csv = headers.join(",") + "\r\n";
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=brand_import_template.csv",
      "Cache-Control": "no-store"
    }
  });
}