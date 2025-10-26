-- Admin batches
CREATE TABLE IF NOT EXISTS admin_batches (
  id TEXT PRIMARY KEY,                 -- ULID
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,                -- e.g., import_brands, import_creators, users_delete, users_suspend
  meta_json TEXT,                      -- JSON blob with context
  created_at INTEGER NOT NULL          -- unix seconds
);

-- Audit log
CREATE TABLE IF NOT EXISTS admin_audit (
  id TEXT PRIMARY KEY,                 -- ULID
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,                -- verb
  entity_table TEXT NOT NULL,
  entity_id TEXT,
  before_json TEXT,
  after_json  TEXT,
  batch_id TEXT,                       -- fk -> admin_batches.id (not enforced)
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_batch ON admin_audit(batch_id);

-- Recycle bin for hard deletes / undo
CREATE TABLE IF NOT EXISTS admin_recycle_bin (
  id TEXT PRIMARY KEY,                 -- ULID
  entity_table TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_json TEXT NOT NULL,           -- full row JSON
  batch_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_recycle_batch ON admin_recycle_bin(batch_id);

-- Users admin meta (keeps schema changes out of core users table)
CREATE TABLE IF NOT EXISTS users_admin_meta (
  user_id TEXT PRIMARY KEY,            -- fk -> users.id (logical)
  last_login_at INTEGER,               -- unix seconds
  bestie_score REAL,                   -- 0..100
  suspended_at INTEGER                 -- null => active
);

-- Seeded Brands Directory
CREATE TABLE IF NOT EXISTS directory_brands (
  id TEXT PRIMARY KEY,                 -- ULID
  public_code TEXT UNIQUE NOT NULL,    -- 10-digit with Luhn, starts with 5
  brand_name TEXT NOT NULL,
  brand_name_lower TEXT NOT NULL,
  website TEXT,
  website_normalized TEXT,             -- host/path normalized
  shortDesc TEXT,
  category_1 TEXT, category_2 TEXT, category_3 TEXT,
  public_contact TEXT,
  reviews_total INTEGER,
  rating_avg REAL,
  priceRange TEXT,
  estimated_monthly TEXT,              -- traffic or revenue (string to allow "Unknown")
  customer_age_range TEXT,
  customer_sex TEXT,
  social_platform_1 TEXT,
  social_platform_2 TEXT,
  top_creator_videos_1 TEXT,
  top_creator_videos_2 TEXT,
  last_seen TEXT,
  status TEXT NOT NULL DEFAULT 'seeded', -- seeded|verified|connected
  import_batch_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
-- Uniqueness rules
CREATE UNIQUE INDEX IF NOT EXISTS uq_dir_brands_site
  ON directory_brands(website_normalized)
  WHERE website_normalized IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_dir_brands_name_when_no_site
  ON directory_brands(brand_name_lower)
  WHERE website_normalized IS NULL;
CREATE INDEX IF NOT EXISTS idx_dir_brands_name ON directory_brands(brand_name_lower);
CREATE INDEX IF NOT EXISTS idx_dir_brands_last_seen ON directory_brands(last_seen);

-- Seeded Creators Directory
CREATE TABLE IF NOT EXISTS directory_creators (
  id TEXT PRIMARY KEY,                 -- ULID
  public_code TEXT UNIQUE NOT NULL,    -- 10-digit with Luhn, starts with 3
  platform TEXT,                       -- tiktok|instagram|mixed|unknown
  handle TEXT,
  handle_lower TEXT,
  tiktok_user_id TEXT,
  instagram_user_id TEXT,
  email TEXT,
  audience_country TEXT,
  followers_total INTEGER,
  avg_weekly_posts REAL,
  engagement_rate REAL,
  avg_views INTEGER,
  avg_likes INTEGER,
  avg_comments INTEGER,
  avg_shares INTEGER,
  audience_category_1 TEXT,
  audience_category_2 TEXT,
  audience_category_3 TEXT,
  audience_age_range TEXT,
  audience_sex TEXT,
  audience_location TEXT,
  last_active TEXT,
  -- per-platform metrics (optional)
  tiktok_followers INTEGER,
  tiktok_avg_views INTEGER,
  tiktok_avg_likes INTEGER,
  tiktok_avg_comments INTEGER,
  tiktok_avg_shares INTEGER,
  instagram_followers INTEGER,
  instagram_avg_views INTEGER,
  instagram_avg_likes INTEGER,
  instagram_avg_comments INTEGER,
  instagram_avg_shares INTEGER,
  status TEXT NOT NULL DEFAULT 'seeded', -- seeded|verified|connected
  import_batch_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
-- Uniqueness rules
CREATE UNIQUE INDEX IF NOT EXISTS uq_dir_creators_ttid
  ON directory_creators(tiktok_user_id) WHERE tiktok_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_dir_creators_igid
  ON directory_creators(instagram_user_id) WHERE instagram_user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_dir_creators_platform_handle
  ON directory_creators(platform, handle_lower)
  WHERE platform IS NOT NULL AND handle_lower IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dir_creators_last_active ON directory_creators(last_active);
CREATE INDEX IF NOT EXISTS idx_dir_creators_aud_country ON directory_creators(audience_country);

-- Mappings when a seeded record later connects
CREATE TABLE IF NOT EXISTS brand_merge_map (
  directory_brand_id TEXT NOT NULL,
  account_user_id TEXT NOT NULL,
  merged_at INTEGER NOT NULL,
  admin_batch_id TEXT,
  PRIMARY KEY (directory_brand_id, account_user_id)
);

CREATE TABLE IF NOT EXISTS creator_merge_map (
  directory_creator_id TEXT NOT NULL,
  account_user_id TEXT NOT NULL,
  merged_at INTEGER NOT NULL,
  admin_batch_id TEXT,
  PRIMARY KEY (directory_creator_id, account_user_id)
);

-- Invites which can target either namespace
CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,                 -- ULID
  inviter_user_id TEXT NOT NULL,
  target_type TEXT NOT NULL,           -- brand_directory|creator_directory|user
  target_id TEXT NOT NULL,
  status TEXT NOT NULL,                -- draft|sent|accepted|declined|expired|revoked
  batch_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_invites_target ON invites(target_type, target_id);
