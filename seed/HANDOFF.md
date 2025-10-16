[HANDOFF 2025-10-16 15:21 PST] — Latest active session (Part 2 of 2, Handoff Rules v3.0)

Project: Bestie Collabs — Admin Brands Import (Dry run + Commit)

Snapshot Summary
- Dry run and commit are fully functional via API and UI.
- UI page: /admin/brands/ with #file, Dry run, Commit controls.
- Admin header required: x-admin-email. Allowlist active.
- CSV must be sent as text/plain. CSV header has 11 exact columns.

Current Progress (as of this session)
- Verified API:
  - POST /api/admin/import/brands/batches  → returns { ok, id, mode: \"dry-run\", counts, header }
  - POST /api/admin/import/brands/batches/{id}/commit → returns { ok, id, committed: true }
- Verified UI:
  - admin/app.js wires #file to Dry run and Commit (supports old/new IDs).
  - Dry run updates status; Commit publishes and confirms.
- Confirmed inserts via:
  - GET /api/admin/chipchip/brands/list with x-admin-email header.

Contracts (source of truth)
CSV Header (11):
brand_name,website_url,category_primary,category_secondary,category_tertiary,instagram_url,tiktok_url,description,customer_age_min,customer_age_max,us_based

API:
1) POST /api/admin/import/brands/batches
   - Headers: content-type: text/plain, x-admin-email: <admin>
   - Body: raw CSV text
   - Success: { ok, id, mode: \"dry-run\", counts:{ total, valid, invalid }, header }
2) POST /api/admin/import/brands/batches/{id}/commit
   - Headers: x-admin-email: <admin>
   - Body: none
   - Success: { ok, id, committed: true }

Frontend Wiring
- File: /admin/app.js
- Behavior:
  - Detects /admin/brands/
  - Dry run → POST CSV (text/plain) to /batches
  - Save id → window.BRAND_IMPORT_ID
  - Commit → POST /batches/{id}/commit
- Tolerates IDs: (#dryBtn|#dryrun) and (#commitBtn|#commit)
- Shows status in #uploadStatus or #actout when present

Admin Gating
- Header: x-admin-email
- Source: window.ADMIN_EMAIL or localStorage.adminEmail
- Whoami helper in app.js shows allowed/denied badge when present

Smoke Test (PowerShell)
# Dry run
Invoke-RestMethod -Method Post 
  -Uri \"https://api.bestiecollabs.com/api/admin/import/brands/batches\" 
  -Headers @{ \"x-admin-email\"=\"collabsbestie@gmail.com\"; \"Content-Type\"=\"text/plain\" } 
  -Body @\"
brand_name,website_url,category_primary,category_secondary,category_tertiary,instagram_url,tiktok_url,description,customer_age_min,customer_age_max,us_based
Acme,https://acme.com,Beauty,,,,Test,25,44,true
\"@

# Commit
Invoke-RestMethod -Method Post 
  -Uri \"https://api.bestiecollabs.com/api/admin/import/brands/batches/REPLACE_ID/commit\" 
  -Headers @{ \"x-admin-email\"=\"collabsbestie@gmail.com\" }

Known Risks / Gotchas
- Wrong content-type (application/json) → 400 or wrong path.
- Missing x-admin-email → 401/403.
- Stale bundle → UI buttons appear inert; hard refresh or redeploy.
- Button IDs in HTML must match one of the supported sets.

Next 2 Tasks (up next)
1) Auto-refresh brands table after Commit
   - Update admin/app.js to call the existing table refresh routine post-commit.
   - Show a lightweight toast/snackbar \"Publish OK\" with batch id.
   - Zero API changes; UI-only improvement.

2) Server-side strict CSV header validation + clearer errors
   - Validate exact 11-column order and names; return explicit error list on mismatch.
   - Include sample header in error response for quick fixes.
   - Add a minimal unit test covering: good header, missing column, extra column.

Ownership and Locations
- UI: /admin/brands/index.html, /admin/app.js
- APIs: /functions/api/admin/import/brands/batches/index.js, /functions/api/admin/import/brands/batches/[id]/commit.js
- Health: /api/admin/chipchip/brands/list

This HANDOFF.md supersedes prior snapshots and is the active working state for brand import.
--- END HANDOFF ---
