
 Γ¢à∩╕Å wrangler 4.42.1
ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
≡ƒîÇ Executing on remote database DB (7ccf7968-cb51-4001-a81b-ca235b8d2403):
≡ƒîÇ To execute on your local development database, remove the --remote flag from your wrangler command.
≡ƒÜú Executed 1 command in 0.4867ms
[
  {
    "results": [
      {
        "name": "idx_admin_audit_batch",
        "type": "index",
        "sql": "CREATE INDEX idx_admin_audit_batch ON admin_audit(batch_id)"
      },
      {
        "name": "idx_admin_audit_created",
        "type": "index",
        "sql": "CREATE INDEX idx_admin_audit_created ON admin_audit(created_at DESC)"
      },
      {
        "name": "idx_dir_brands_last_seen",
        "type": "index",
        "sql": "CREATE INDEX idx_dir_brands_last_seen ON directory_brands(last_seen)"
      },
      {
        "name": "idx_dir_brands_name",
        "type": "index",
        "sql": "CREATE INDEX idx_dir_brands_name ON directory_brands(brand_name_lower)"
      },
      {
        "name": "idx_dir_creators_aud_country",
        "type": "index",
        "sql": "CREATE INDEX idx_dir_creators_aud_country ON directory_creators(audience_country)"
      },
      {
        "name": "idx_dir_creators_last_active",
        "type": "index",
        "sql": "CREATE INDEX idx_dir_creators_last_active ON directory_creators(last_active)"
      },
      {
        "name": "idx_invites_target",
        "type": "index",
        "sql": "CREATE INDEX idx_invites_target ON invites(target_type, target_id)"
      },
      {
        "name": "idx_recycle_batch",
        "type": "index",
        "sql": "CREATE INDEX idx_recycle_batch ON admin_recycle_bin(batch_id)"
      },
      {
        "name": "sqlite_autoindex_admin_audit_1",
        "type": "index",
        "sql": null
      },
      {
        "name": "sqlite_autoindex_admin_batches_1",
        "type": "index",
        "sql": null
      },
      {
        "name": "sqlite_autoindex_admin_recycle_bin_1",
        "type": "index",
        "sql": null
      },
      {
        "name": "sqlite_autoindex_brand_merge_map_1",
        "type": "index",
        "sql": null
      },
      {
        "name": "sqlite_autoindex_creator_merge_map_1",
        "type": "index",
        "sql": null
      },
      {
        "name": "sqlite_autoindex_creators_1",
        "type": "index",
        "sql": null
      },
      {
        "name": "sqlite_autoindex_d1_migrations_1",
        "type": "index",
        "sql": null
      },
      {
        "name": "sqlite_autoindex_directory_brands_1",
        "type": "index",
        "sql": null
      },
      {
        "name": "sqlite_autoindex_directory_brands_2",
        "type": "index",
        "sql": null
      },
      {
        "name": "sqlite_autoindex_directory_creators_1",
        "type": "index",
        "sql": null
      },
      {
        "name": "sqlite_autoindex_directory_creators_2",
        "type": "index",
        "sql": null
      },
      {
        "name": "sqlite_autoindex_invites_1",
        "type": "index",
        "sql": null
      },
      {
        "name": "sqlite_autoindex_users_1",
        "type": "index",
        "sql": null
      },
      {
        "name": "sqlite_autoindex_users_2",
        "type": "index",
        "sql": null
      },
      {
        "name": "sqlite_autoindex_users_admin_meta_1",
        "type": "index",
        "sql": null
      },
      {
        "name": "uq_dir_brands_name_when_no_site",
        "type": "index",
        "sql": "CREATE UNIQUE INDEX uq_dir_brands_name_when_no_site\r\n  ON directory_brands(brand_name_lower)\r\n  WHERE website_normalized IS NULL"
      },
      {
        "name": "uq_dir_brands_site",
        "type": "index",
        "sql": "CREATE UNIQUE INDEX uq_dir_brands_site\r\n  ON directory_brands(website_normalized)\r\n  WHERE website_normalized IS NOT NULL"
      },
      {
        "name": "uq_dir_creators_handle",
        "type": "index",
        "sql": "CREATE UNIQUE INDEX uq_dir_creators_handle ON directory_creators(platform, handle_lower)"
      },
      {
        "name": "uq_dir_creators_igid",
        "type": "index",
        "sql": "CREATE UNIQUE INDEX uq_dir_creators_igid\r\n  ON directory_creators(instagram_user_id) WHERE instagram_user_id IS NOT NULL"
      },
      {
        "name": "uq_dir_creators_instagram",
        "type": "index",
        "sql": "CREATE UNIQUE INDEX uq_dir_creators_instagram ON directory_creators(instagram_user_id)"
      },
      {
        "name": "uq_dir_creators_platform_handle",
        "type": "index",
        "sql": "CREATE UNIQUE INDEX uq_dir_creators_platform_handle\r\n  ON directory_creators(platform, handle_lower)\r\n  WHERE platform IS NOT NULL AND handle_lower IS NOT NULL"
      },
      {
        "name": "uq_dir_creators_tiktok",
        "type": "index",
        "sql": "CREATE UNIQUE INDEX uq_dir_creators_tiktok ON directory_creators(tiktok_user_id)"
      },
      {
        "name": "uq_dir_creators_ttid",
        "type": "index",
        "sql": "CREATE UNIQUE INDEX uq_dir_creators_ttid\r\n  ON directory_creators(tiktok_user_id) WHERE tiktok_user_id IS NOT NULL"
      },
      {
        "name": "uq_directory_brands_name",
        "type": "index",
        "sql": "CREATE UNIQUE INDEX uq_directory_brands_name ON directory_brands(brand_name_lower)"
      },
      {
        "name": "uq_directory_brands_site",
        "type": "index",
        "sql": "CREATE UNIQUE INDEX uq_directory_brands_site ON directory_brands(website_normalized)"
      },
      {
        "name": "users_email_idx",
        "type": "index",
        "sql": "CREATE INDEX users_email_idx ON users(email)"
      },
      {
        "name": "users_username_idx",
        "type": "index",
        "sql": "CREATE INDEX users_username_idx ON users(username)"
      }
    ],
    "success": true,
    "meta": {
      "served_by": "v3-prod",
      "served_by_region": "WNAM",
      "served_by_primary": true,
      "timings": {
        "sql_duration_ms": 0.4867
      },
      "duration": 0.4867,
      "changes": 0,
      "last_row_id": 0,
      "changed_db": false,
      "size_after": 225280,
      "rows_read": 85,
      "rows_written": 0,
      "total_attempts": 1
    }
  }
]
