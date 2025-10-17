[HANDOFF 2025-10-16 22:49 PST] Handoff v3.0 — Part 2 of 2 — Latest active session
Status: Production-first on main. Admin brands read is live. Debug SQL is live. CSV upload is POST-only and strict. Commit handler exists. Batch list/rows GET routes are currently missing, so UI list and commit UX are limited.

# Bestie Collabs — Handoff (v3.0)

## Current progress
- Admin data read: **GET /api/admin/brands** returns active rows from D1 rands where deleted_at IS NULL.
- Diagnostics: **GET /api/debug/sql?sql=...** is available for read-only SELECT checks against D1.
- Import upload: **POST /api/admin/import/brands/batches** enforces strict CSV header validation and writes to import_batches + import_rows(parsed_json, errors_json, valid).
- Commit: **POST /api/admin/import/brands/batches/:id/commit** upserts valid import_rows into rands and marks the batch committed when changes occur.
- Routing: Pages Functions includes /api/* and /api/debug/*.

## Known gaps
- UI expectations: Missing **GET** routes for batch listing and batch rows (/api/admin/import/brands/batches, /api/admin/import/brands/batches/:id/rows) cause 404s and block table population and commit UX.
- Schema guardrails: rands requires website_url and category_primary on insert; commit logic supplies safe defaults but needs verification across varied inputs.

## Next two tasks (do next)
1) **Restore read routes for imports**  
   Implement GET /api/admin/import/brands/batches and GET /api/admin/import/brands/batches/:id/rows to power UI list + review. Return minimal, stable fields and paginate.
2) **End-to-end import proof**  
   Upload a small valid CSV, commit a batch, then verify rows via both GET /api/admin/brands and the UI table. Add negative tests for header rejection and invalid rows.

## Operational constants
- Admin header: x-admin-email: collabsbestie@gmail.com
- UI path: /admin/brands/ with #file, #dryBtn|#dryrun, #commitBtn|#commit
- Domains: https://bestiecollabs.com , https://api.bestiecollabs.com
- D1 source of truth: rands with deleted_at IS NULL as active

## Runbooks
### Production smoke
1. Count: SELECT COUNT(*) AS cnt FROM brands WHERE deleted_at IS NULL;
2. Recent: SELECT id,status,import_batch_id,name,slug,created_at FROM brands WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5;
3. Import state: query import_batches and import_rows via debug SQL until read routes are restored.

### Failure modes
- **Build**: TypeScript in .js, duplicate consts, or route file placement. Fix and redeploy.
- **404**: Route not implemented or misrouted. Confirm _routes.json and function path.
- **500**: D1 query shape mismatch. Reduce columns, remove GROUP BY, then narrow.

## Change log pointer
See /seed/CHANGELOG_AI.md for timestamped entries under v3.0.
