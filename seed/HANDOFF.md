# Handoff - Bestie Collabs (Handoff Rules v3.0)
[HANDOFF 2025-10-17 20:38 PST]  Latest Active Session  -  Part 2 of 2

## Overview
This document is the single source of truth for the active handoff. It captures the current admin brands workflow, endpoints, data model, and the next two tasks for the following session.

## Repository and Hosting
- Repository: bestiecollabs/bc
- Deploy target: Cloudflare Pages + Cloudflare Workers
- Domain: bestiecollabs.com
- Admin header required on all admin API calls: x-admin-email: collabsbestie@gmail.com
- Allowed methods for /api/*: GET, POST, PATCH, OPTIONS
- HTML charset: text/html; charset=utf-8

## Runtime Bindings and Environment
- Cloudflare D1 logical database name: bestiedb
- Worker binding name: env.DB
- The importer and admin list endpoints must use env.DB exclusively.

## Current Admin Brands Flow
1) Upload CSV in Admin - Brands page. All new and updated rows are saved as status=in_review with is_public=0.
2) Admin reviews rows under the In Review table.
3) Publish selected issues PATCH /api/admin/brands/{id} with body { "status": "published", "is_public": 1 }.
4) Active Brands shows all rows with status=published. Unpublished shows status=draft. Deleted section is reserved for future when API exposes deleted filtering.

## Endpoints - Contract Reference
- GET /api/admin/brands
  - Query parameters: status, q, limit, offset
  - Expected JSON: items[] or rows[] array of brand objects
  - Status filter: draft | in_review | published
- PATCH /api/admin/brands/{id}
  - Body fields supported: status, is_public, featured, name, domain, categories
  - Typical publish: { "status": "published", "is_public": 1 }
- POST /api/admin/brands/import
  - multipart/form-data with field "file"
  - Writes rows as status=in_review, is_public=0
  - Response: { ok, inserted, updated, skipped, errors: [] }
- Legacy draft endpoint note
  - GET /api/admin/brands/drafts used earlier for brand_drafts. Not used by the new In Review table. Keep for backward compatibility if present.

## CSV Import Format
Accepted header variants are mapped to canonical fields. The importer tolerates simple CSVs without quoted commas.
- Canonical fields: name, slug, domain, category_primary, category_secondary, category_tertiary, website_url, logo_url
- Accepted variants
  - name: name | brand | brand_name
  - slug: slug | handle
  - domain: domain | shop_domain | store_domain | hostname | website | url | website_url
  - website_url: website | url | website_url
  - logo_url: logo | logo_url | image | image_url
- Auto-fill rules
  - slug auto-generated from name if missing
  - domain derived from website url if domain missing
  - status forced to in_review and is_public set to 0
- Example header line
  - name,slug,domain,category_primary,category_secondary,category_tertiary,website_url,logo_url

## Data Model - brands table
Columns
- id INTEGER PRIMARY KEY AUTOINCREMENT
- name TEXT NOT NULL
- slug TEXT NOT NULL UNIQUE
- domain TEXT NOT NULL
- status TEXT NOT NULL DEFAULT in_review
- is_public INTEGER NOT NULL DEFAULT 0
- featured INTEGER NOT NULL DEFAULT 0
- category_primary TEXT
- category_secondary TEXT
- category_tertiary TEXT
- website_url TEXT
- logo_url TEXT
- source_row_id TEXT
- created_at TEXT NOT NULL DEFAULT datetime('now')
- updated_at TEXT NOT NULL DEFAULT datetime('now')
- deleted_at TEXT NULL

Indexes
- idx_brands_status on status
- idx_brands_domain on domain
- idx_brands_slug on slug

## UI - Admin Brands Page Behavior
- In Review section
  - Reads GET /api/admin/brands?status=in_review&limit=100
  - Displays name, domain, categories, and a checkbox for bulk publish
  - Bulk action triggers PATCH per id to set published and is_public=1
- Active Brands
  - Client-side shows items with status=published
  - Search via q parameter when backend supports it
- Unpublished Brands
  - Shows status=draft
- Deleted Brands
  - Placeholder until API exposes deleted or a deleted_at filter

## Operational Runbooks
Deploy
1) Commit and push to main. Cloudflare Pages builds and deploys.
2) Confirm build green in Cloudflare dashboard.

Verify after deploy
1) Load Admin - Brands.
2) Upload a small CSV with one brand.
3) Check In Review table updates within seconds.
4) Publish selected. Confirm brand appears in Active Brands.

Troubleshoot common issues
- UI stuck at Loading...
  - Check browser console for errors. Confirm endpoint returns valid JSON.
  - Verify response key items[] or rows[]. The loader normalizes both.
- Uploaded but In Review empty
  - Verify API honors status=in_review.
  - Confirm rows exist with status=in_review in the database.
- Mojibake in titles or labels
  - Ensure text/html; charset=utf-8 header is served for .html pages.
  - Keep UI strings ASCII.

## Security Notes
- Admin calls must include x-admin-email.
- Do not expose internal database IDs in URLs outside admin.
- Enforce CORS with GET, POST, PATCH, OPTIONS on /api/*.

## Current Progress - This Session
- In Review table sources rows from brands with status=in_review.
- Bulk publish uses PATCH and promotes rows to Active Brands.
- UI strings normalized to ASCII. Buttons renamed to Search.
- Charset header defined for .html to prevent mojibake.

## Next 2 Tasks - For Next Session
1) D1 and Endpoint Consistency
   - Goal: server-side enforce status filtering on GET /api/admin/brands and standardize response to items[].
   - Acceptance: requesting status=in_review returns only those rows; response always includes items[].
   - Tests: three queries for in_review, draft, published return disjoint sets.

2) Deleted Brands Listing
   - Goal: implement soft-deleted browse and restore.
   - API: GET /api/admin/brands?deleted=1 and PATCH /api/admin/brands/{id} { "deleted_at": null } for restore.
   - UI: render Deleted section with Restore buttons.
   - Acceptance: deleted rows listed, restore returns row to draft or in_review based on prior status.

## Running Log - Latest on Top
- [2025-10-17 20:38 PST] v3.0 - Part 2 of 2 - Latest Active Session. In Review reads from brands; bulk publish via PATCH; UI simplified; charset enforced.
- See /seed/AI_README.md for Part 1 of 2 details and historical context.