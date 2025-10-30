# DB Reference

- Product: Cloudflare D1
- Environment: Production only
- Pages Functions binding: DB (env.DB)
- Database name: bestiedb
- Database ID: 7ccf7968-cb51-4001-a81b-ca235b8d2403
- Remote query examples:
  - npx wrangler d1 list
  - npx wrangler d1 execute bestiedb --remote --command "<SQL>"
  - npx wrangler d1 execute bestiedb --remote --file .\schema.sql

## All objects (from sqlite_master)

 ⛅️ wrangler 4.45.2
───────────────────
🌀 Executing on remote database bestiedb (7ccf7968-cb51-4001-a81b-ca235b8d2403):
🌀 To execute on your local development database, remove the --remote flag from your wrangler command.
🚣 Executed 1 command in 0.6006ms
[
  {
    "results": [
      {
        "name": "idx_admin_audit_batch",
        "type": "index"
      },
      {
        "name": "idx_admin_audit_created",
        "type": "index"
      },
      {
        "name": "idx_brands_categories",
        "type": "index"
      },
      {
        "name": "idx_brands_deleted_at",
        "type": "index"
      },
      {
        "name": "idx_brands_featured",
        "type": "index"
      },
      {
        "name": "idx_brands_slug",
        "type": "index"
      },
      {
        "name": "idx_brands_slug_unique",
        "type": "index"
      },
      {
        "name": "idx_brands_status",
        "type": "index"
      },
      {
        "name": "idx_creators_deleted_at",
        "type": "index"
      },
      {
        "name": "idx_dir_brands_last_seen",
        "type": "index"
      },
      {
        "name": "idx_dir_brands_name",
        "type": "index"
      },
      {
        "name": "idx_dir_creators_aud_country",
        "type": "index"
      },
      {
        "name": "idx_dir_creators_last_active",
        "type": "index"
      },
      {
        "name": "idx_import_rows_batch",
        "type": "index"
      },
      {
        "name": "idx_invites_target",
        "type": "index"
      },
      {
        "name": "idx_recycle_batch",
        "type": "index"
      },
      {
        "name": "ix_brands_name",
        "type": "index"
      },
      {
        "name": "ix_brands_status",
        "type": "index"
      },
      {
        "name": "sqlite_autoindex_admin_audit_1",
        "type": "index"
      },
      {
        "name": "sqlite_autoindex_admin_batches_1",
        "type": "index"
      },
      {
        "name": "sqlite_autoindex_admin_recycle_bin_1",
        "type": "index"
      },
      {
        "name": "sqlite_autoindex_brand_merge_map_1",
        "type": "index"
      },
      {
        "name": "sqlite_autoindex_brands_1",
        "type": "index"
      },
      {
        "name": "sqlite_autoindex_brands_2",
        "type": "index"
      },
      {
        "name": "sqlite_autoindex_config_1",
        "type": "index"
      },
      {
        "name": "sqlite_autoindex_creator_merge_map_1",
        "type": "index"
      },
      {
        "name": "sqlite_autoindex_creators_1",
        "type": "index"
      },
      {
        "name": "sqlite_autoindex_d1_migrations_1",
        "type": "index"
      },
      {
        "name": "sqlite_autoindex_directory_brands_1",
        "type": "index"
      },
      {
        "name": "sqlite_autoindex_directory_brands_2",
        "type": "index"
      },
      {
        "name": "sqlite_autoindex_directory_creators_1",
        "type": "index"
      },
      {
        "name": "sqlite_autoindex_directory_creators_2",
        "type": "index"
      },
      {
        "name": "sqlite_autoindex_invites_1",
        "type": "index"
      },
      {
        "name": "sqlite_autoindex_users_1",
        "type": "index"
      },
      {
        "name": "sqlite_autoindex_users_2",
        "type": "index"
      },
      {
        "name": "sqlite_autoindex_users_admin_meta_1",
        "type": "index"
      },
      {
        "name": "uq_dir_brands_name_when_no_site",
        "type": "index"
      },
      {
        "name": "uq_dir_brands_site",
        "type": "index"
      },
      {
        "name": "uq_dir_creators_handle",
        "type": "index"
      },
      {
        "name": "uq_dir_creators_igid",
        "type": "index"
      },
      {
        "name": "uq_dir_creators_instagram",
        "type": "index"
      },
      {
        "name": "uq_dir_creators_platform_handle",
        "type": "index"
      },
      {
        "name": "uq_dir_creators_tiktok",
        "type": "index"
      },
      {
        "name": "uq_dir_creators_ttid",
        "type": "index"
      },
      {
        "name": "uq_directory_brands_name",
        "type": "index"
      },
      {
        "name": "uq_directory_brands_site",
        "type": "index"
      },
      {
        "name": "users_email_idx",
        "type": "index"
      },
      {
        "name": "users_username_idx",
        "type": "index"
      },
      {
        "name": "ux_brands_shopify_domain",
        "type": "index"
      },
      {
        "name": "ux_brands_shopify_domain_norm",
        "type": "index"
      },
      {
        "name": "ux_brands_website_host_norm",
        "type": "index"
      },
      {
        "name": "ux_brands_website_url",
        "type": "index"
      },
      {
        "name": "_cf_KV",
        "type": "table"
      },
      {
        "name": "addresses",
        "type": "table"
      },
      {
        "name": "admin_audit",
        "type": "table"
      },
      {
        "name": "admin_batches",
        "type": "table"
      },
      {
        "name": "admin_recycle_bin",
        "type": "table"
      },
      {
        "name": "brand_drafts",
        "type": "table"
      },
      {
        "name": "brand_merge_map",
        "type": "table"
      },
      {
        "name": "brands",
        "type": "table"
      },
      {
        "name": "config",
        "type": "table"
      },
      {
        "name": "creator_merge_map",
        "type": "table"
      },
      {
        "name": "creators",
        "type": "table"
      },
      {
        "name": "d1_migrations",
        "type": "table"
      },
      {
        "name": "directory_brands",
        "type": "table"
      },
      {
        "name": "directory_creators",
        "type": "table"
      },
      {
        "name": "import_batches",
        "type": "table"
      },
      {
        "name": "import_rows",
        "type": "table"
      },
      {
        "name": "invites",
        "type": "table"
      },
      {
        "name": "sqlite_sequence",
        "type": "table"
      },
      {
        "name": "users",
        "type": "table"
      },
      {
        "name": "users_admin_meta",
        "type": "table"
      },
      {
        "name": "trg_brands_updated_at",
        "type": "trigger"
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WNAM",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 0.6006
      },
      "duration": 0.6006,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 1671168,
      "rows_read": 146,
      "rows_written": 0,
      "total_attempts": 1
    }
  }
]


## CREATE statements (selected)

 ⛅️ wrangler 4.45.2
───────────────────
🌀 Executing on remote database bestiedb (7ccf7968-cb51-4001-a81b-ca235b8d2403):
🌀 To execute on your local development database, remove the --remote flag from your wrangler command.
🚣 Executed 1 command in 0.4658ms
[
  {
    "results": [
      {
        "name": "creators",
        "sql": "CREATE TABLE creators (   open_id TEXT PRIMARY KEY,   display_name TEXT,   avatar TEXT,   role TEXT,   connected_at INTEGER , deleted_at TEXT DEFAULT NULL)"
      },
      {
        "name": "users",
        "sql": "CREATE TABLE users (   id INTEGER PRIMARY KEY,   email TEXT UNIQUE NOT NULL,   username TEXT UNIQUE,   full_name TEXT,   role TEXT NOT NULL CHECK (role IN ('brand','creator')),   phone TEXT,   terms_version TEXT,   accepted_terms_at INTEGER,   created_at INTEGER NOT NULL DEFAULT (unixepoch()),   updated_at INTEGER NOT NULL DEFAULT (unixepoch()),   pw_salt TEXT,   pw_hash TEXT )"
      },
      {
        "name": "addresses",
        "sql": "CREATE TABLE addresses (   user_id INTEGER PRIMARY KEY,   country TEXT,   street TEXT,   city TEXT,   region TEXT,   postal TEXT,   updated_at INTEGER NOT NULL DEFAULT (unixepoch()),   FOREIGN KEY(user_id) REFERENCES users(id) )"
      },
      {
        "name": "users_admin_meta",
        "sql": "CREATE TABLE users_admin_meta (\r\n  user_id TEXT PRIMARY KEY,            -- fk -> users.id (logical)\r\n  last_login_at INTEGER,               -- unix seconds\r\n  bestie_score REAL,                   -- 0..100\r\n  suspended_at INTEGER                 -- null => active\r\n)"
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
        "name": "brands",
        "sql": "CREATE TABLE brands (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  slug TEXT NOT NULL UNIQUE,\n  domain TEXT UNIQUE,\n  website_url TEXT NOT NULL,\n  category_primary TEXT NOT NULL,\n  category_secondary TEXT,\n  category_tertiary TEXT,\n  instagram_url TEXT,\n  tiktok_url TEXT,\n  shopify_shop_domain TEXT,\n  description TEXT,\n  contact_email TEXT,\n  logo_url TEXT,\n  status TEXT NOT NULL CHECK (status IN ('draft','published')) DEFAULT 'draft',\n  featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0,1)),\n  has_us_presence INTEGER NOT NULL DEFAULT 1 CHECK (has_us_presence IN (0,1)),\n  is_dropshipper INTEGER NOT NULL DEFAULT 0 CHECK (is_dropshipper IN (0,1)),\n  import_batch_id TEXT,\n  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),\n  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))\n, website_host_norm TEXT, shopify_domain_norm TEXT, deleted_at TEXT DEFAULT NULL, is_public INTEGER, customer_age_min INTEGER, customer_age_max INTEGER, price_low REAL, price_high REAL, affiliate_program INTEGER DEFAULT 0, cookie_days INTEGER DEFAULT 30, contact_form_url TEXT, brand_values TEXT, monthly_site_visits INTEGER, markets_primary TEXT DEFAULT 'US', country TEXT, state TEXT, city TEXT, zipcode TEXT, address TEXT, contact_name TEXT, contact_title TEXT, contact_phone TEXT, affiliate_cookie_days INTEGER DEFAULT 30, monthly_visits INTEGER DEFAULT 0, gifting_ok INTEGER DEFAULT 0)"
      },
      {
        "name": "config",
        "sql": "CREATE TABLE config (\n  key TEXT PRIMARY KEY,\n  value TEXT NOT NULL,\n  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))\n)"
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WNAM",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 0.4658
      },
      "duration": 0.4658,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 1671168,
      "rows_read": 73,
      "rows_written": 0,
      "total_attempts": 1
    }
  }
]


## Columns (selected tables)

### users

 ⛅️ wrangler 4.45.2
───────────────────
🌀 Executing on remote database bestiedb (7ccf7968-cb51-4001-a81b-ca235b8d2403):
🌀 To execute on your local development database, remove the --remote flag from your wrangler command.
🚣 Executed 1 command in 0.6474ms
[
  {
    "results": [
      {
        "cid": 0,
        "name": "id",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 1
      },
      {
        "cid": 1,
        "name": "email",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 2,
        "name": "username",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 3,
        "name": "full_name",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 4,
        "name": "role",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 5,
        "name": "phone",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 6,
        "name": "terms_version",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 7,
        "name": "accepted_terms_at",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 8,
        "name": "created_at",
        "type": "INTEGER",
        "notnull": 1,
        "dflt_value": "unixepoch()",
        "pk": 0
      },
      {
        "cid": 9,
        "name": "updated_at",
        "type": "INTEGER",
        "notnull": 1,
        "dflt_value": "unixepoch()",
        "pk": 0
      },
      {
        "cid": 10,
        "name": "pw_salt",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 11,
        "name": "pw_hash",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WNAM",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 0.6474
      },
      "duration": 0.6474,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 1671168,
      "rows_read": 0,
      "rows_written": 0,
      "total_attempts": 1
    }
  }
]


### users_admin_meta

 ⛅️ wrangler 4.45.2
───────────────────
🌀 Executing on remote database bestiedb (7ccf7968-cb51-4001-a81b-ca235b8d2403):
🌀 To execute on your local development database, remove the --remote flag from your wrangler command.
🚣 Executed 1 command in 0.3813ms
[
  {
    "results": [
      {
        "cid": 0,
        "name": "user_id",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 1
      },
      {
        "cid": 1,
        "name": "last_login_at",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 2,
        "name": "bestie_score",
        "type": "REAL",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 3,
        "name": "suspended_at",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WNAM",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 0.3813
      },
      "duration": 0.3813,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 1671168,
      "rows_read": 0,
      "rows_written": 0,
      "total_attempts": 1
    }
  }
]


### brands

 ⛅️ wrangler 4.45.2
───────────────────
🌀 Executing on remote database bestiedb (7ccf7968-cb51-4001-a81b-ca235b8d2403):
🌀 To execute on your local development database, remove the --remote flag from your wrangler command.
🚣 Executed 1 command in 0.4977ms
[
  {
    "results": [
      {
        "cid": 0,
        "name": "id",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 1
      },
      {
        "cid": 1,
        "name": "name",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 2,
        "name": "slug",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 3,
        "name": "domain",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 4,
        "name": "website_url",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 5,
        "name": "category_primary",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 6,
        "name": "category_secondary",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 7,
        "name": "category_tertiary",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 8,
        "name": "instagram_url",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 9,
        "name": "tiktok_url",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 10,
        "name": "shopify_shop_domain",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 11,
        "name": "description",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 12,
        "name": "contact_email",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 13,
        "name": "logo_url",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 14,
        "name": "status",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": "'draft'",
        "pk": 0
      },
      {
        "cid": 15,
        "name": "featured",
        "type": "INTEGER",
        "notnull": 1,
        "dflt_value": "0",
        "pk": 0
      },
      {
        "cid": 16,
        "name": "has_us_presence",
        "type": "INTEGER",
        "notnull": 1,
        "dflt_value": "1",
        "pk": 0
      },
      {
        "cid": 17,
        "name": "is_dropshipper",
        "type": "INTEGER",
        "notnull": 1,
        "dflt_value": "0",
        "pk": 0
      },
      {
        "cid": 18,
        "name": "import_batch_id",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 19,
        "name": "created_at",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": "strftime('%Y-%m-%dT%H:%M:%fZ','now')",
        "pk": 0
      },
      {
        "cid": 20,
        "name": "updated_at",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": "strftime('%Y-%m-%dT%H:%M:%fZ','now')",
        "pk": 0
      },
      {
        "cid": 21,
        "name": "website_host_norm",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 22,
        "name": "shopify_domain_norm",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 23,
        "name": "deleted_at",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": "NULL",
        "pk": 0
      },
      {
        "cid": 24,
        "name": "is_public",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 25,
        "name": "customer_age_min",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 26,
        "name": "customer_age_max",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 27,
        "name": "price_low",
        "type": "REAL",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 28,
        "name": "price_high",
        "type": "REAL",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 29,
        "name": "affiliate_program",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": "0",
        "pk": 0
      },
      {
        "cid": 30,
        "name": "cookie_days",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": "30",
        "pk": 0
      },
      {
        "cid": 31,
        "name": "contact_form_url",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 32,
        "name": "brand_values",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 33,
        "name": "monthly_site_visits",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 34,
        "name": "markets_primary",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": "'US'",
        "pk": 0
      },
      {
        "cid": 35,
        "name": "country",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 36,
        "name": "state",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 37,
        "name": "city",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 38,
        "name": "zipcode",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 39,
        "name": "address",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 40,
        "name": "contact_name",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 41,
        "name": "contact_title",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 42,
        "name": "contact_phone",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 43,
        "name": "affiliate_cookie_days",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": "30",
        "pk": 0
      },
      {
        "cid": 44,
        "name": "monthly_visits",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": "0",
        "pk": 0
      },
      {
        "cid": 45,
        "name": "gifting_ok",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": "0",
        "pk": 0
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WNAM",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 0.4977
      },
      "duration": 0.4977,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 1671168,
      "rows_read": 0,
      "rows_written": 0,
      "total_attempts": 1
    }
  }
]


### creators

 ⛅️ wrangler 4.45.2
───────────────────
🌀 Executing on remote database bestiedb (7ccf7968-cb51-4001-a81b-ca235b8d2403):
🌀 To execute on your local development database, remove the --remote flag from your wrangler command.
🚣 Executed 1 command in 0.3559ms
[
  {
    "results": [
      {
        "cid": 0,
        "name": "open_id",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 1
      },
      {
        "cid": 1,
        "name": "display_name",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 2,
        "name": "avatar",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 3,
        "name": "role",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 4,
        "name": "connected_at",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 5,
        "name": "deleted_at",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": "NULL",
        "pk": 0
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WNAM",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 0.3559
      },
      "duration": 0.3559,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 1671168,
      "rows_read": 0,
      "rows_written": 0,
      "total_attempts": 1
    }
  }
]


### addresses

 ⛅️ wrangler 4.45.2
───────────────────
🌀 Executing on remote database bestiedb (7ccf7968-cb51-4001-a81b-ca235b8d2403):
🌀 To execute on your local development database, remove the --remote flag from your wrangler command.
🚣 Executed 1 command in 0.3489ms
[
  {
    "results": [
      {
        "cid": 0,
        "name": "user_id",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 1
      },
      {
        "cid": 1,
        "name": "country",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 2,
        "name": "street",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 3,
        "name": "city",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 4,
        "name": "region",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 5,
        "name": "postal",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 6,
        "name": "updated_at",
        "type": "INTEGER",
        "notnull": 1,
        "dflt_value": "unixepoch()",
        "pk": 0
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WNAM",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 0.3489
      },
      "duration": 0.3489,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 1671168,
      "rows_read": 0,
      "rows_written": 0,
      "total_attempts": 1
    }
  }
]


### invites

 ⛅️ wrangler 4.45.2
───────────────────
🌀 Executing on remote database bestiedb (7ccf7968-cb51-4001-a81b-ca235b8d2403):
🌀 To execute on your local development database, remove the --remote flag from your wrangler command.
🚣 Executed 1 command in 0.2361ms
[
  {
    "results": [
      {
        "cid": 0,
        "name": "id",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 1
      },
      {
        "cid": 1,
        "name": "inviter_user_id",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 2,
        "name": "target_type",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 3,
        "name": "target_id",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 4,
        "name": "status",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 5,
        "name": "batch_id",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 6,
        "name": "created_at",
        "type": "INTEGER",
        "notnull": 1,
        "dflt_value": null,
        "pk": 0
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WNAM",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 0.2361
      },
      "duration": 0.2361,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 1671168,
      "rows_read": 0,
      "rows_written": 0,
      "total_attempts": 1
    }
  }
]


### config

 ⛅️ wrangler 4.45.2
───────────────────
🌀 Executing on remote database bestiedb (7ccf7968-cb51-4001-a81b-ca235b8d2403):
🌀 To execute on your local development database, remove the --remote flag from your wrangler command.
🚣 Executed 1 command in 0.4243ms
[
  {
    "results": [
      {
        "cid": 0,
        "name": "key",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 1
      },
      {
        "cid": 1,
        "name": "value",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 2,
        "name": "updated_at",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": "strftime('%Y-%m-%dT%H:%M:%fZ','now')",
        "pk": 0
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WNAM",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 0.4243
      },
      "duration": 0.4243,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 1671168,
      "rows_read": 0,
      "rows_written": 0,
      "total_attempts": 1
    }
  }
]


### directory_brands

 ⛅️ wrangler 4.45.2
───────────────────
🌀 Executing on remote database bestiedb (7ccf7968-cb51-4001-a81b-ca235b8d2403):
🌀 To execute on your local development database, remove the --remote flag from your wrangler command.
🚣 Executed 1 command in 1.2935ms
[
  {
    "results": [
      {
        "cid": 0,
        "name": "id",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 1
      },
      {
        "cid": 1,
        "name": "public_code",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 2,
        "name": "brand_name",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 3,
        "name": "brand_name_lower",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 4,
        "name": "website",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 5,
        "name": "website_normalized",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 6,
        "name": "shortDesc",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 7,
        "name": "category_1",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 8,
        "name": "category_2",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 9,
        "name": "category_3",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 10,
        "name": "public_contact",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 11,
        "name": "reviews_total",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 12,
        "name": "rating_avg",
        "type": "REAL",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 13,
        "name": "priceRange",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 14,
        "name": "estimated_monthly",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 15,
        "name": "customer_age_range",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 16,
        "name": "customer_sex",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 17,
        "name": "social_platform_1",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 18,
        "name": "social_platform_2",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 19,
        "name": "top_creator_videos_1",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 20,
        "name": "top_creator_videos_2",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 21,
        "name": "last_seen",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 22,
        "name": "status",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": "'seeded'",
        "pk": 0
      },
      {
        "cid": 23,
        "name": "import_batch_id",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 24,
        "name": "created_at",
        "type": "INTEGER",
        "notnull": 1,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 25,
        "name": "updated_at",
        "type": "INTEGER",
        "notnull": 1,
        "dflt_value": null,
        "pk": 0
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WNAM",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 1.2935
      },
      "duration": 1.2935,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 1671168,
      "rows_read": 0,
      "rows_written": 0,
      "total_attempts": 1
    }
  }
]


### directory_creators

 ⛅️ wrangler 4.45.2
───────────────────
🌀 Executing on remote database bestiedb (7ccf7968-cb51-4001-a81b-ca235b8d2403):
🌀 To execute on your local development database, remove the --remote flag from your wrangler command.
🚣 Executed 1 command in 0.609ms
[
  {
    "results": [
      {
        "cid": 0,
        "name": "id",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 1
      },
      {
        "cid": 1,
        "name": "public_code",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 2,
        "name": "platform",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 3,
        "name": "handle",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 4,
        "name": "handle_lower",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 5,
        "name": "tiktok_user_id",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 6,
        "name": "instagram_user_id",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 7,
        "name": "email",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 8,
        "name": "audience_country",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 9,
        "name": "followers_total",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 10,
        "name": "avg_weekly_posts",
        "type": "REAL",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 11,
        "name": "engagement_rate",
        "type": "REAL",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 12,
        "name": "avg_views",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 13,
        "name": "avg_likes",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 14,
        "name": "avg_comments",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 15,
        "name": "avg_shares",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 16,
        "name": "audience_category_1",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 17,
        "name": "audience_category_2",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 18,
        "name": "audience_category_3",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 19,
        "name": "audience_age_range",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 20,
        "name": "audience_sex",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 21,
        "name": "audience_location",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 22,
        "name": "last_active",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 23,
        "name": "tiktok_followers",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 24,
        "name": "tiktok_avg_views",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 25,
        "name": "tiktok_avg_likes",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 26,
        "name": "tiktok_avg_comments",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 27,
        "name": "tiktok_avg_shares",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 28,
        "name": "instagram_followers",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 29,
        "name": "instagram_avg_views",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 30,
        "name": "instagram_avg_likes",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 31,
        "name": "instagram_avg_comments",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 32,
        "name": "instagram_avg_shares",
        "type": "INTEGER",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 33,
        "name": "status",
        "type": "TEXT",
        "notnull": 1,
        "dflt_value": "'seeded'",
        "pk": 0
      },
      {
        "cid": 34,
        "name": "import_batch_id",
        "type": "TEXT",
        "notnull": 0,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 35,
        "name": "created_at",
        "type": "INTEGER",
        "notnull": 1,
        "dflt_value": null,
        "pk": 0
      },
      {
        "cid": 36,
        "name": "updated_at",
        "type": "INTEGER",
        "notnull": 1,
        "dflt_value": null,
        "pk": 0
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WNAM",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 0.609
      },
      "duration": 0.609,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 1671168,
      "rows_read": 0,
      "rows_written": 0,
      "total_attempts": 1
    }
  }
]

