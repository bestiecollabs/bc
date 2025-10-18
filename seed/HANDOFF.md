[HANDOFF 2025-10-17 22:19 PST] (Handoff Rules v3.0) — Latest active — Part 2 of 2

Project
- Bestie Collabs

Environment
- Cloudflare Pages + Workers + D1
- DB binding: env.DB → bestiedb
- Admin header: x-admin-email: collabsbestie@gmail.com
- Active directory: C:\bc\cloudflare\html
- UI: ASCII-only, left nav, simple theme
- CORS: GET, POST, PATCH, OPTIONS
- Loaders normalize to items[]

Status recap (Task 1 complete)
- GET /api/admin/brands enforces server-side filters; returns { ok, total, limit, offset, items }.
- Filters:
  - status=in_review|published|draft|archived
  - deleted=1 for soft-deleted listing
- OPTIONS /api/admin/brands returns 204 with proper CORS headers.
- Admin gate enforced via ADMIN_ADMINS (includes collabsbestie@gmail.com).
- PATCH /api/admin/brands/{id} supports:
  - { delete:true } → soft delete (sets deleted_at)
  - { restore:true } → restore (clears deleted_at)
  - { status:"…" } → in_review|published|draft|archived
  - { is_public:0|1 }
- D1 live counts at test time:
  - Non-deleted: published=2, draft=1, in_review=0
  - Deleted: 2 (after restore of id=1)

CSV import notes
- Importer requires strict 11-column header set and order:
  brand_name, website_url, category_primary, category_secondary, category_tertiary, instagram_url, tiktok_url, description, customer_age_min, customer_age_max, us_based
- UI table columns can be independent, but product direction is to align visible columns to the CSV fields.
- Commit path should set status='in_review' on insert (preserve existing on conflict). Verify commit bindings.

Endpoints (admin)
- GET  /api/admin/brands?status=&deleted=&limit=&offset=
  - Returns CSV-aligned fields plus id/slug/status/updated_at/deleted_at for actions.
- PATCH /api/admin/brands/{id}
  - Accepts { delete:true | restore:true | status:"…" | is_public:0|1 }
  - Returns { ok, item }.
- OPTIONS implemented for both index and id routes.

Known decisions
- Charset header helpers are optional and not required for upload; removed from scope to keep tree clean.

Next 2 tasks (queue)
1) Admin UI — Brands page
   - Show the same CSV-aligned columns across all cards (In Review, Active, Unpublished, Deleted).
   - Add checkbox + per-row Delete on all cards except Deleted; keep Actions on the right.
   - Add Bulk Delete toolbar action; Deleted card shows Restore only.
   - Data source:
     - In Review → GET /api/admin/brands?status=in_review&limit=100
     - Active → GET /api/admin/brands?status=published&limit=100
     - Unpublished → GET /api/admin/brands?status=draft&limit=100
     - Deleted → GET /api/admin/brands?deleted=1&limit=100
   - Wire per-row Delete → PATCH /api/admin/brands/{id} { delete:true }
   - Wire per-row Restore (Deleted) → PATCH /api/admin/brands/{id} { restore:true }

2) Import commit flow
   - Ensure commit sets status='in_review' on insert; keep COALESCE(existing,status) on conflict.
   - Validate 11 headers; surface server errors in UI toast so failures aren’t silent.
   - Add small server-side guard: trim/normalize booleans and ints (customer_age_min/max, us_based).

Verification checklist
- Unauthorized request to /api/admin/brands → 401 {"error":"not_allowed"}.
- OPTIONS on /api/admin/brands → 204 with methods GET,POST,PATCH,OPTIONS and headers content-type,x-admin-email.
- Deleted list reflects soft delete and restore actions immediately.
- In Review populates after commit or after setting status='in_review'.

Handoff owner → next
- Continue under Handoff Rules v3.0. Treat this block as the latest active session.
- Do not change file paths or response shapes without updating this HANDOFF.md first.