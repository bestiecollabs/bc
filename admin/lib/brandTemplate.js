/* admin/lib/brandTemplate.js
   Single source of truth for the Agent CSV template used by Admin.
   Exposes window.BrandTemplate with HEADERS and FILENAME.
*/
(function (root) {
  var BrandTemplate = {
    FILENAME: "brand_import_template.csv",
    HEADERS: [
      "brand_name","website_url",
      "category_primary","category_secondary","category_tertiary",
      "instagram_url","tiktok_url",
      "description",
      "customer_age_min","customer_age_max",
      "us_based"
    ]
  };
  root.BrandTemplate = BrandTemplate;
})(window);