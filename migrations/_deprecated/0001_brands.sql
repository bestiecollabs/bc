-- 0001_brands.sql
-- Brands table for Admin CSV import
CREATE TABLE IF NOT EXISTS brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  website_url TEXT,
  category_primary TEXT,
  category_secondary TEXT,
  category_tertiary TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  shopify_shop_domain TEXT,
  shopify_shop_id TEXT,
  shopify_public_url TEXT,
  contact_name TEXT,
  contact_title TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  country TEXT,
  state TEXT,
  city TEXT,
  zipcode TEXT,
  address TEXT,
  description TEXT,
  support_email TEXT,
  logo_url TEXT,
  featured INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  has_us_presence INTEGER DEFAULT 0,
  is_dropshipper INTEGER DEFAULT 0,
  notes_admin TEXT,
  created_at TEXT DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT DEFAULT (CURRENT_TIMESTAMP),
  deleted_at TEXT
);

-- Case-insensitive uniqueness on key identifiers
CREATE UNIQUE INDEX IF NOT EXISTS ux_brands_website_url
  ON brands(website_url COLLATE NOCASE)
  WHERE website_url IS NOT NULL AND website_url <> '';

CREATE UNIQUE INDEX IF NOT EXISTS ux_brands_shopify_domain
  ON brands(shopify_shop_domain COLLATE NOCASE)
  WHERE shopify_shop_domain IS NOT NULL AND shopify_shop_domain <> '';

-- Helpful filters
CREATE INDEX IF NOT EXISTS ix_brands_status ON brands(status);
CREATE INDEX IF NOT EXISTS ix_brands_name ON brands(name COLLATE NOCASE);

-- Auto-update updated_at on any update
DROP TRIGGER IF EXISTS trg_brands_updated_at;
CREATE TRIGGER trg_brands_updated_at
AFTER UPDATE ON brands
FOR EACH ROW BEGIN
  UPDATE brands SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
