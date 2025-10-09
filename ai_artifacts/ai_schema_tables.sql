
 Γ¢à∩╕Å wrangler 4.42.1
ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
≡ƒîÇ Executing on remote database DB (7ccf7968-cb51-4001-a81b-ca235b8d2403):
≡ƒîÇ To execute on your local development database, remove the --remote flag from your wrangler command.
≡ƒÜú Executed 1 command in 0.337ms
[
  {
    "results": [
      {
        "name": "_cf_KV",
        "sql": "CREATE TABLE _cf_KV (\n        key TEXT PRIMARY KEY,\n        value BLOB\n      ) WITHOUT ROWID"
      },
      {
        "name": "addresses",
        "sql": "CREATE TABLE addresses (   user_id INTEGER PRIMARY KEY,   country TEXT,   street TEXT,   city TEXT,   region TEXT,   postal TEXT,   updated_at INTEGER NOT NULL DEFAULT (unixepoch()),   FOREIGN KEY(user_id) REFERENCES users(id) )"
      },
      {
        "name": "admin_audit",
        "sql": "CREATE TABLE admin_audit (\r\n  id TEXT PRIMARY KEY,                 -- ULID\r\n  actor_email TEXT NOT NULL,\r\n  action TEXT NOT NULL,                -- verb\r\n  entity_table TEXT NOT NULL,\r\n  entity_id TEXT,\r\n  before_json TEXT,\r\n  after_json  TEXT,\r\n  batch_id TEXT,                       -- fk -> admin_batches.id (not enforced)\r\n  created_at INTEGER NOT NULL\r\n)"
      },
      {
        "name": "admin_batches",
        "sql": "CREATE TABLE admin_batches (\r\n  id TEXT PRIMARY KEY,                 -- ULID\r\n  actor_email TEXT NOT NULL,\r\n  action TEXT NOT NULL,                -- e.g., import_brands, import_creators, users_delete, users_suspend\r\n  meta_json TEXT,                      -- JSON blob with context\r\n  created_at INTEGER NOT NULL          -- unix seconds\r\n)"
      },
      {
        "name": "admin_recycle_bin",
        "sql": "CREATE TABLE admin_recycle_bin (\r\n  id TEXT PRIMARY KEY,                 -- ULID\r\n  entity_table TEXT NOT NULL,\r\n  entity_id TEXT NOT NULL,\r\n  before_json TEXT NOT NULL,           -- full row JSON\r\n  batch_id TEXT NOT NULL,\r\n  created_at INTEGER NOT NULL\r\n)"
      },
      {
        "name": "brand_merge_map",
        "sql": "CREATE TABLE brand_merge_map (\r\n  directory_brand_id TEXT NOT NULL,\r\n  account_user_id TEXT NOT NULL,\r\n  merged_at INTEGER NOT NULL,\r\n  admin_batch_id TEXT,\r\n  PRIMARY KEY (directory_brand_id, account_user_id)\r\n)"
      },
      {
        "name": "creator_merge_map",
        "sql": "CREATE TABLE creator_merge_map (\r\n  directory_creator_id TEXT NOT NULL,\r\n  account_user_id TEXT NOT NULL,\r\n  merged_at INTEGER NOT NULL,\r\n  admin_batch_id TEXT,\r\n  PRIMARY KEY (directory_creator_id, account_user_id)\r\n)"
      },
      {
        "name": "creators",
        "sql": "CREATE TABLE creators (   open_id TEXT PRIMARY KEY,   display_name TEXT,   avatar TEXT,   role TEXT,   connected_at INTEGER )"
      },
      {
        "name": "d1_migrations",
        "sql": "CREATE TABLE d1_migrations(\n\t\tid         INTEGER PRIMARY KEY AUTOINCREMENT,\n\t\tname       TEXT UNIQUE,\n\t\tapplied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL\n)"
      },
      {
        "name": "directory_brands",
        "sql": "CREATE TABLE directory_brands (\r\n  id TEXT PRIMARY KEY,                 -- ULID\r\n  public_code TEXT UNIQUE NOT NULL,    -- 10-digit with Luhn, starts with 5\r\n  brand_name TEXT NOT NULL,\r\n  brand_name_lower TEXT NOT NULL,\r\n  website TEXT,\r\n  website_normalized TEXT,             -- host/path normalized\r\n  shortDesc TEXT,\r\n  category_1 TEXT, category_2 TEXT, category_3 TEXT,\r\n  public_contact TEXT,\r\n  reviews_total INTEGER,\r\n  rating_avg REAL,\r\n  priceRange TEXT,\r\n  estimated_monthly TEXT,              -- traffic or revenue (string to allow \"Unknown\")\r\n  customer_age_range TEXT,\r\n  customer_sex TEXT,\r\n  social_platform_1 TEXT,\r\n  social_platform_2 TEXT,\r\n  top_creator_videos_1 TEXT,\r\n  top_creator_videos_2 TEXT,\r\n  last_seen TEXT,\r\n  status TEXT NOT NULL DEFAULT 'seeded', -- seeded|verified|connected\r\n  import_batch_id TEXT,\r\n  created_at INTEGER NOT NULL,\r\n  updated_at INTEGER NOT NULL\r\n)"
      },
      {
        "name": "directory_creators",
        "sql": "CREATE TABLE directory_creators (\r\n  id TEXT PRIMARY KEY,                 -- ULID\r\n  public_code TEXT UNIQUE NOT NULL,    -- 10-digit with Luhn, starts with 3\r\n  platform TEXT,                       -- tiktok|instagram|mixed|unknown\r\n  handle TEXT,\r\n  handle_lower TEXT,\r\n  tiktok_user_id TEXT,\r\n  instagram_user_id TEXT,\r\n  email TEXT,\r\n  audience_country TEXT,\r\n  followers_total INTEGER,\r\n  avg_weekly_posts REAL,\r\n  engagement_rate REAL,\r\n  avg_views INTEGER,\r\n  avg_likes INTEGER,\r\n  avg_comments INTEGER,\r\n  avg_shares INTEGER,\r\n  audience_category_1 TEXT,\r\n  audience_category_2 TEXT,\r\n  audience_category_3 TEXT,\r\n  audience_age_range TEXT,\r\n  audience_sex TEXT,\r\n  audience_location TEXT,\r\n  last_active TEXT,\r\n  -- per-platform metrics (optional)\r\n  tiktok_followers INTEGER,\r\n  tiktok_avg_views INTEGER,\r\n  tiktok_avg_likes INTEGER,\r\n  tiktok_avg_comments INTEGER,\r\n  tiktok_avg_shares INTEGER,\r\n  instagram_followers INTEGER,\r\n  instagram_avg_views INTEGER,\r\n  instagram_avg_likes INTEGER,\r\n  instagram_avg_comments INTEGER,\r\n  instagram_avg_shares INTEGER,\r\n  status TEXT NOT NULL DEFAULT 'seeded', -- seeded|verified|connected\r\n  import_batch_id TEXT,\r\n  created_at INTEGER NOT NULL,\r\n  updated_at INTEGER NOT NULL\r\n)"
      },
      {
        "name": "invites",
        "sql": "CREATE TABLE invites (\r\n  id TEXT PRIMARY KEY,                 -- ULID\r\n  inviter_user_id TEXT NOT NULL,\r\n  target_type TEXT NOT NULL,           -- brand_directory|creator_directory|user\r\n  target_id TEXT NOT NULL,\r\n  status TEXT NOT NULL,                -- draft|sent|accepted|declined|expired|revoked\r\n  batch_id TEXT,\r\n  created_at INTEGER NOT NULL\r\n)"
      },
      {
        "name": "sqlite_sequence",
        "sql": "CREATE TABLE sqlite_sequence(name,seq)"
      },
      {
        "name": "users",
        "sql": "CREATE TABLE users (   id INTEGER PRIMARY KEY,   email TEXT UNIQUE NOT NULL,   username TEXT UNIQUE,   full_name TEXT,   role TEXT NOT NULL CHECK (role IN ('brand','creator')),   phone TEXT,   terms_version TEXT,   accepted_terms_at INTEGER,   created_at INTEGER NOT NULL DEFAULT (unixepoch()),   updated_at INTEGER NOT NULL DEFAULT (unixepoch()),   pw_salt TEXT,   pw_hash TEXT )"
      },
      {
        "name": "users_admin_meta",
        "sql": "CREATE TABLE users_admin_meta (\r\n  user_id TEXT PRIMARY KEY,            -- fk -> users.id (logical)\r\n  last_login_at INTEGER,               -- unix seconds\r\n  bestie_score REAL,                   -- 0..100\r\n  suspended_at INTEGER                 -- null => active\r\n)"
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WNAM",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 0.337
      },
      "duration": 0.337,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 225280,
      "rows_read": 65,
      "rows_written": 0,
      "total_attempts": 1
    }
  }
]
