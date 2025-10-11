# Bestie Collabs · AI_README

## Project
Static site + Pages Functions on Cloudflare Pages. D1 database `bestiedb` bound as `DB`. Live URLs:
- Production: https://bestiecollabs.com
- API entry points are under `/api/*`.

## Constraints
- Frontend: static HTML + vanilla JS. No framework.
- Functions live in `/functions/**`. Keep current directories and names.
- Use D1 binding `DB`. No structural renames. No feature removals to “fix” bugs.
- Seed Kit files in `/seed` drive handoffs and SOPs.

## Current Status (2025-10-10)
- **DB**: D1 schema migrated (`brands`, `config`).
- **Config**: `allowed_categories` set to `["Apparel","Beauty","Home"]`.
- **Import**: `/api/admin/import/brands` supports dry-run and commit. Validates:
  - required: `name, website_url, category_primary, status, has_us_presence=1, is_dropshipper=0`
  - US presence required, dropshippers rejected
  - canonical URLs, domain + slug derivation
  - category_primary must be in allow-list
- **Public APIs**:
  - `GET /api/brands?category=&q=&featured=&page=&limit=`
  - `GET /api/categories`
- **Admin APIs**:
  - `GET|PUT /api/admin/config/categories`
  - `POST /api/admin/import/brands?dry_run=1|0` (CSV in multipart or text/csv)
  - `GET /api/admin/brands` (status filter, search, pagination)
  - `PATCH /api/admin/brands/:id` (status, featured, fields)
- **Admin UI**:
  - `/admin/imports/` CSV uploader (Access-protected at the edge)
  - `/admin/brands/` basic table with publish/feature toggles

## Auth (temporary)
- Gate via `x-admin-email` header. Replace with Cloudflare Access JWT in future.

## Data Rules
- US presence required (`has_us_presence=1`)
- No dropshippers (`is_dropshipper=0`)
- Three categories max, relevance-ordered
- Shopify shop (optional) as `shopify_shop_domain`
- Socials: Instagram/TikTok URLs only

## Migrations
- Files in `/migrations/*.sql`
- Apply: `wrangler d1 migrations apply DB --remote`

## Deploy
- Production: `wrangler pages deploy . --project-name bc --branch main`
- Preview: `wrangler pages deploy . --project-name bc`
- Confirm routes via `/api/admin/brands/ping`

## Next
1) Admin Brands: pagination, sort, inline edit, category dropdown.
2) Creators: schema, importer, public/admin endpoints.
