-- 0002_brands_dedupe.sql
-- Add normalized keys and unique indexes to harden de-dupe

ALTER TABLE brands ADD COLUMN website_host_norm TEXT;
ALTER TABLE brands ADD COLUMN shopify_domain_norm TEXT;

-- Backfill normalization for existing rows
-- Normalize website_url -> host: lowercase, strip protocol, strip leading "www.", drop path, drop trailing "/"
UPDATE brands
SET website_host_norm = CASE
  WHEN website_url IS NULL OR TRIM(website_url) = '' THEN NULL
  ELSE
    -- lower and strip protocol
    (WITH w AS (
      SELECT LOWER(REPLACE(REPLACE(TRIM(website_url), 'https://',''), 'http://','')) AS s
    )
    SELECT
      CASE
        WHEN INSTR(s,'/') > 0 THEN
          -- take up to first slash
          (CASE WHEN SUBSTR(s,1,4)='www.' THEN SUBSTR(SUBSTR(s,1,INSTR(s,'/')-1),5) ELSE SUBSTR(s,1,INSTR(s,'/')-1) END)
        ELSE
          -- whole host, drop leading www. and trailing /
          (CASE WHEN SUBSTR(RTRIM(s,'/'),1,4)='www.' THEN SUBSTR(RTRIM(s,'/'),5) ELSE RTRIM(s,'/') END)
      END
    FROM w)
END;

-- Normalize shopify_shop_domain similarly: lowercase and strip leading "www."
UPDATE brands
SET shopify_domain_norm = CASE
  WHEN shopify_shop_domain IS NULL OR TRIM(shopify_shop_domain) = '' THEN NULL
  ELSE
    (CASE
      WHEN SUBSTR(LOWER(TRIM(shopify_shop_domain)),1,4)='www.' THEN SUBSTR(LOWER(TRIM(shopify_shop_domain)),5)
      ELSE LOWER(TRIM(shopify_shop_domain))
    END)
END;

-- Unique constraints on normalized keys (ignore null/empty)
CREATE UNIQUE INDEX IF NOT EXISTS ux_brands_website_host_norm
  ON brands(website_host_norm)
  WHERE website_host_norm IS NOT NULL AND website_host_norm <> '';

CREATE UNIQUE INDEX IF NOT EXISTS ux_brands_shopify_domain_norm
  ON brands(shopify_domain_norm)
  WHERE shopify_domain_norm IS NOT NULL AND shopify_domain_norm <> '';
