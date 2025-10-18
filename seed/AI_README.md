[AI_README 2025-10-17 20:31 PST]  —  Handoff Rules v3.0  —  Latest Active Session  —  Part 1 of 2

PROJECT
- Name: Bestie Collabs (repo: bc)
- Domain: bestiecollabs.com
- Stack: Cloudflare Pages + Workers + D1 (database: bestiedb)
- Admin header required: x-admin-email
- Allowed methods on /api/*: GET, POST, PATCH, OPTIONS

SCOPE OF THIS SESSION
- Admin Brands Directory flow updates:
  - CSV uploads go to status=in_review.
  - “In Review” table reads brands where status=in_review and supports bulk publish via PATCH /api/admin/brands/{id}.
  - Air theme removed; simple theme with left nav added.
  - CORS updated to include PATCH; UTF-8 headers for .html set to avoid mojibake.
  - List loaders hardened; response normalization for items|rows.
- This session is marked ACTIVE.

KNOWN OPEN ITEMS (handoff to next session)
1) Importer vs table read consistency: ensure importer and list endpoints use the same DB binding (env.DB) and status semantics.
2) D1 checks: confirm brands table exists remotely and locally; align migrations where needed.
3) KPI cards for Brands Directory (total_creators, total_sales_30d, avg_gmv_30d, avg_engagement_rate).
4) Deleted Brands listing once API exposes deleted filter.
5) CSV header variants are accepted; keep mapping in importer stable.

HOW TO OPERATE
- Admin auth header:
  - x-admin-email: collabsbestie@gmail.com
- Publish a brand:
  - PATCH /api/admin/brands/{id}  body: { "status": "published", "is_public": 1 }
- In Review table loader:
  - GET /api/admin/brands?status=in_review&limit=100
- Content-Type for .html:
  - text/html; charset=utf-8

QUICK TESTS
- Upload CSV (single button “Upload to In Review”) → rows appear under In Review.
- Select one or more rows → Publish selected → rows move to Active Brands.
- Active/Draft search inputs → “Search” triggers reload.

RISK LOG
- If tables show “Loading...” indefinitely, check console for fetch or JSON shape errors.
- If uploads succeed but In Review is empty, verify status=in_review rows exist in brands and that API filters are honored.
- Mojibake indicates missing charset or non-ASCII literals in source.

FILE TOUCHPOINTS (most relevant this session)
- /admin/brands/index.html
- /_headers
- /functions/api/admin/brands/import.js
- /functions/api/_middleware.js

NEXT SESSION START POINTER
- Begin by verifying D1 brands rows with status=in_review on REMOTE.
- If present, confirm API response shape to the UI: items[] vs rows[] and status filter.
- Proceed to KPI cards and Deleted Brands filter.

[AI_README 2025-10-17 14:33 PST]  (ACTIVE SESSION — Part 1 of 2)
Project: Bestie Collabs
Scope: Admin Brands Directory reliability + state partitions; Unpublish/Publish; soft-delete Undo; CSS reset to light.
Context Summary:
- Directory now renders 3 tables: Active, Unpublished (draft), Deleted.
- Buttons: Active → Delete, Unpublish; Unpublished → Publish, Delete; Deleted → Undo.
- Auto-refresh after each action; robust loading/empty/error states.
- API endpoints in use:
  - GET /api/admin/brands?scope=all&status=<draft|published>&deleted=1
  - POST /api/admin/brands/:id/delete
  - POST /api/admin/brands/:id/undo
  - POST /api/admin/brands/:id/unpublish  → sets status='draft'
  - PATCH /api/admin/brands/:id           → { status: 'published' | 'draft' }
Files Touched (session):
- /admin/brands/index.html  → light styling, 3 tables with stable tbody hooks
- /admin/brands/table.js    → partitioning, delegated actions, auto-refresh, scope=all
- /functions/api/admin/brands/index.js → supports scope/status/deleted filters
- /functions/api/admin/brands/[id].js  → PATCH status + POST delete/undo
Operational Notes:
- Production-first URLs: bestiecollabs.com, api.bestiecollabs.com
- Cloudflare Pages project: bestiecollabs; DB binding: DB → bestiedb
- Access: service token "bc_admin_gpt" allowed by policy (for automated checks)
Next (Part 2 of 2):
- Add success toasts and minimal UX polish; confirm edge cases (publish->undo->publish loops).
- Update HANDOFF.md and ai_tree.txt snapshots.

-- End of ACTIVE block --
[AI_README 2025-10-17 11:23 PST]
LATEST_ACTIVE_SESSION: true
PROJECT: Bestie Collabs (production-first on main)
DOMAINS: https://bestiecollabs.com, https://api.bestiecollabs.com
ADMIN HEADER: x-admin-email=collabsbestie@gmail.com
DB: Cloudflare D1 (binding DB). Active brands have deleted_at IS NULL.

SCOPE THIS SESSION:
- Restored import reads: GET /api/admin/import/brands/batches, GET /api/admin/import/brands/batches/:id/rows.
- Directory UI loads from GET /api/admin/brands (table.js) and Refresh works.
- Added soft-delete endpoints: POST /api/admin/brands/:id/delete and /api/admin/brands/:id/undo.

IMPLEMENTED ENDPOINTS:
- GET  /api/admin/import/brands/batches           -> list batches {id,status,source_uri,created_at} with ?limit&offset
- GET  /api/admin/import/brands/batches/:id/rows  -> list rows {id,row_num,valid,parsed{...}} with ?limit&offset
- GET  /api/admin/brands                          -> list active brands (deleted_at IS NULL)
- POST /api/admin/brands/:id/delete               -> set deleted_at = now
- POST /api/admin/brands/:id/undo                 -> set deleted_at = NULL

UI WIRING STATUS:
- /admin/brands/table.js loads directory and wires Refresh.
- Delete/Undo wired to POST endpoints with admin header. Table refreshes on success.

KNOWN GAPS / NEXT:
- Add Unpublish endpoint (status='draft') and wire button.
- Import: return commit counts {inserted, updated, skipped}.
- Normalize CSV header validation and casing on server.
- Add pagination cursor support for large batch/row lists.

RUNBOOK:
1) Admin API calls must include: x-admin-email: collabsbestie@gmail.com.
2) Brands list shows only active rows (deleted_at IS NULL).
3) Soft delete/undo toggles deleted_at and triggers UI refresh.
4) If UI shows "Loading…", confirm GET /api/admin/brands returns 200 and check console.

FILES TOUCHED (this session):
- functions/api/admin/import/brands/batches/index.ts
- functions/api/admin/import/brands/batches/[id]/rows.ts
- functions/api/admin/brands/[id]/delete.ts
- functions/api/admin/brands/[id]/undo.ts
- admin/brands/table.js (loader + Refresh + Delete/Undo)

[AI_README 2025-10-16 22:48 PST] Handoff v3.0 â€” Part 1 of 2 â€” Latest active session
Status: Production-first on main. Pages Functions live. Admin UI reads /api/admin/brands. Import list routes currently missing (GET /api/admin/import/brands/batches, /rows).
Next: Restore read routes or adjust UI to POST-only flow. Commit handler writes to brands via D1.
[AI_README 2025-10-15 20:22 PST] â€” Latest Active Session (Part 1 of 2)

PROJECT
- Bestie Collabs (production-first on Cloudflare Pages + Functions)

RUNTIME
- Frontend: static HTML + vanilla JS
- API: Cloudflare Pages Functions in /functions
- DB: Cloudflare D1 (binding: DB)
- Domains: https://bestiecollabs.com  |  https://api.bestiecollabs.com
- Health: GET /api/healthcheck -> { ok: true }

HANDOFF RULES
- Use Handoff Rules v3.0 (persisted): full files, no patches, prod-first, numbered steps, â€œWhat to expectâ€.
- Do NOT commit or echo secrets. Read from environment only.

ENVIRONMENT (secrets present â€” stored privately in Cloudflare/GitHub; values NOT in repo)
- CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET
- CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, CLOUDFLARE_WORKER_DOMAIN, D1_DATABASE_ID
- SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_SCOPES, SHOPIFY_ENCRYPTION_KEY
- TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_WEBHOOK_VERIFY_TOKEN
Note: These are configured in Cloudflare Pages (Production) and GitHub Actions. Do not add values to git.
To verify runtime presence, use /api/admin/debug-env (names only), never print secrets.

STATUS
- Brand CSV import: ingest + commit endpoints and admin UI wired.
- Next focus: public Brand Directory surface after CSV commits.

THIS SESSION
- Purpose: Seed fresh AI_README + CHANGELOG entries and record secret names for future assistants.
- Scope: Doc-only update; no code or schema changes.

---
[AI_README 2025-10-15 17:59 PST]  # Latest Active Session Ã¢â‚¬Â¢ v3.0 Ã¢â‚¬Â¢ Part 1 of 2

PROJECT
- Name: Bestie Collabs (BC)
- Scope: Admin-operated brand and creator directory, CSV-driven brand onboarding, and public /brands directory.
- Owners: Dao C (product), Bestie Collabs engineering (Cloudflare Pages + Workers).

RATIONALE
This AI_README is the single source of operational truth for AI agents and humans when making safe, reversible changes. It follows Handoff Rules v3.0: log first, act deterministically, and leave auditable trails.

SYSTEM OVERVIEW
- Hosting: Cloudflare Pages (static) + Cloudflare Workers (API under /api/*)
- Admin UI: /admin and /admin/brands
- Public: /brands and /brands/{slug}/
- Data: CSV imports create or upsert brand records via Admin APIs.

ADMIN AUTH (CURRENT)
- Header: x-admin-email
- Value source: localStorage key adminEmail (loaded by /admin/config.js)
- Required policy: email must be in env.ADMIN_ADMINS or default allow-list.
- Example curl:
  curl -sS -H "x-admin-email: collabsbestie@gmail.com" https://bestiecollabs.com/api/admin/brands

CSV IMPORT SPEC (STRICT, 11 columns)
brand_name,website_url,category_primary,category_secondary,category_tertiary,instagram_url,tiktok_url,description,customer_age_min,customer_age_max,us_based

API CONTRACTS (INTENT)
- GET  /api/admin/brands                     -> { ok, page, limit, total, items: Brand[] }
- POST /api/admin/import/brands/batches      -> { ok, id, mode }  # mode: dry-run | commit
- POST /api/admin/import/brands/batches/{id}/rows
                                              { ok, accepted, rejected, reasons? }
- POST /api/admin/import/brands/batches/{id}/commit
                                              { ok, committed, errors? }
Return JSON with content-type: application/json. Always validate header list before writes.

FRONTEND EXPECTATIONS
- /admin/brands loads /admin/config.js first.
- import.js sends credentials:'include' and 'x-admin-email'.
- Status area element id=uploadStatus is optional but recommended.

DEPLOYMENT (PAGES)
1) git add -A && git commit
2) Push to main; Cloudflare Pages auto-builds.
3) Worker routes under /functions (Pages Functions).

TESTING CHECKLIST
- Browser console: localStorage.setItem('adminEmail','collabsbestie@gmail.com')
- GET /api/admin/brands returns 200 with items[]
- CSV template matches 11 headers exactly
- Dry-run flow completes (batch -> rows -> commit=false)
- Commit flow completes (batch -> rows -> commit=true)
- Public directory lists published brands

KNOWN GAPS TO VERIFY IN NEXT SESSION (Part 2)
- Ensure POST handler path shape matches Pages Functions router:
  /functions/api/admin/import/brands/batches/index.js with onRequestPost
  /functions/api/admin/import/brands/batches/[id]/rows.js with onRequestPost
  /functions/api/admin/import/brands/batches/[id]/commit.js with onRequestPost
- Server-side header validation and ADMIN_ADMINS env.

RUNNING LOG (v3.0 format)
- session_id: bc-20251015180000
- started_at: 2025-10-15 17:59 PST
- actor: AI assistant (v3.0 handoff)
- status: active
- changes:
  - Seeded AI_README and CHANGELOG_AI
  - Documented CSV headers and admin auth header
  - Listed required API endpoints and router expectations
- next: finalize POST handlers and end-to-end import test
- notes: This is the authoritative handoff context for subsequent automation.


[AI_README 2025-10-15 10:50 PST]  // v3.0 handoff ? part 1 of 2 ? LATEST ACTIVE SESSION
Scope: Persist authoritative, production-first context for Bestie Collabs.
Owner: Dao / bestiecollabs.com
Environment: Cloudflare Pages project "bc" (domains: bestiecollabs.com, api.bestiecollabs.com), D1 "bestiedb" (binding: DB).

Key Rules (v3.0):
- Production-first. Deploy via git push to main; Wrangler only for hotfixes.
- No renames/restructures without approval; complete files only (no diffs).
- Keep running logs: AI_README (prepend), CHANGELOG_AI (append), HANDOFF snapshot when applicable.

What?s new this session:
- Removed duplicate admin page: /admin/brands ? 301 to /admin/brands/.
- Confirmed admin gating via Access; set ADMIN_ALLOW_ANY=0 for prod.
- Hardened scripts/deploy-prod.ps1 with preflights and safe ahead/behind parsing.
- Retired scripts/deploy-preview.ps1; prod-only workflow.

Operational: 
- CSV Import lives at /admin/brands/ and is the canonical UI.
- Redirects enforced in _redirects for /admin/brands and /admin/brands ? /admin/brands/.
- Deploy: scripts/deploy-prod.ps1 (preferred: push to main). Wrangler hotfix allowed with -Wrangler.
- Verification endpoints: 
  - GET https://api.bestiecollabs.com/api/admin/debug-env  (checks allowlist secret presence)
  - GET https://api.bestiecollabs.com/api/admin/whoami    (allowed=false when not on allowlist)

Next Focus (part 2 of 2, upcoming):
- Finalize Admin Dashboard shell and KPIs.
- CSV import UX polish: clearer per-row messages and post-commit surface area.

This block supersedes earlier context and is the authoritative live state at the time above.

[AI_README 2025-10-14 22:29 PST]
Context: Cloudflare Pages project = bc. Branch = main. Commit = a118ead4744074e7ff965761ac0110b8d724b18a.
Today?s work:
- Fixed template-agent Worker: correct 11-column Brand Template + filename.
- Cleaned Admin/Brands page copy; aligned accepted headers to Agent list.
- Added dry-run analyzer endpoint (/api/admin/import/brands/analyze) and UI.
- Verified Worker via PowerShell test. Purged caches. Confirmed behavior.

Final Brand Template headers:
brand_name,website_url,category_primary,category_secondary,category_tertiary,instagram_url,tiktok_url,description,customer_age_min,customer_age_max,us_based

Next 2 Tasks:
1) Commit pipeline for imports: turn dry-run results into upsert (dry-run + commit with clear report).
2) Public /brands directory: list + detail pages sourced from DB.

---
[AI_README 2025-10-14 22:26 PST]
Context: Cloudflare Pages project = bc. Branch = main. Commit = a118ead4744074e7ff965761ac0110b8d724b18a.
Today?s work:
- Fixed template-agent Worker: correct 11-column Brand Template + filename.
- Cleaned Admin/Brands page copy; aligned accepted headers to Agent list.
- Added dry-run analyzer endpoint (/api/admin/import/brands/analyze) and UI.
- Verified Worker via PowerShell test. Purged caches. Confirmed behavior.

Final Brand Template headers:
brand_name,website_url,category_primary,category_secondary,category_tertiary,instagram_url,tiktok_url,description,customer_age_min,customer_age_max,us_based

Next 2 Tasks:
1) Commit pipeline for imports: turn dry-run results into upsert (dry-run + commit with clear report).
2) Public /brands directory: list + detail pages sourced from DB.

---



[AI_README 2025-10-17 12:24 PST]
- Brands Directory: /admin/brands/table.js now renders Delete/Undo/Unpublish with delegated click handling and auto-refresh after success.
- API: Added POST /api/admin/brands/:id/unpublish → sets status='draft'.

