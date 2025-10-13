-- Brands table for directory and admin import
CREATE TABLE IF NOT EXISTS brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT UNIQUE,
  website_url TEXT NOT NULL,
  category_primary TEXT NOT NULL,
  category_secondary TEXT,
  category_tertiary TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  shopify_shop_domain TEXT,
  description TEXT,
  contact_email TEXT,
  logo_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft','published')) DEFAULT 'draft',
  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0,1)),
  has_us_presence INTEGER NOT NULL DEFAULT 1 CHECK (has_us_presence IN (0,1)),
  is_dropshipper INTEGER NOT NULL DEFAULT 0 CHECK (is_dropshipper IN (0,1)),
  import_batch_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_brands_status ON brands(status);
CREATE INDEX IF NOT EXISTS idx_brands_featured ON brands(featured);
CREATE INDEX IF NOT EXISTS idx_brands_categories ON brands(category_primary, category_secondary, category_tertiary);
