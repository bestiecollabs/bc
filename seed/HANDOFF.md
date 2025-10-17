# Bestie Collabs — HANDOFF (v3.0)
[HANDOFF 2025-10-17 11:25 PST]  
LATEST_ACTIVE_SESSION: true  
PART: 2 of 2

## Production Context
- Deploy target: **main** branch → Cloudflare Pages (project: bestiecollabs).
- Domains: **https://bestiecollabs.com**, **https://api.bestiecollabs.com**.
- Admin header required: x-admin-email: collabsbestie@gmail.com.
- Database: Cloudflare D1 (**DB**). Active brands: deleted_at IS NULL.

## Work Completed in this Session
### Backend
- Restored import reads:
  - GET /api/admin/import/brands/batches (limit/offset, {id,status,source_uri,created_at}).
  - GET /api/admin/import/brands/batches/:id/rows (limit/offset, {id,row_num,valid,parsed{...}}).
- Directory management:
  - GET /api/admin/brands used by UI to render the Directory table.
  - **Soft delete**: POST /api/admin/brands/:id/delete → sets deleted_at = now.
  - **Undo delete**: POST /api/admin/brands/:id/undo → sets deleted_at = NULL.

### Frontend
- /admin/brands/table.js loads Directory table from GET /api/admin/brands, wires **Refresh**, **Delete**, and **Undo**.  
- On success, table re-fetches and re-renders.

## Current Status
- Directory page: loads and refreshes successfully.
- Delete/Undo backend: returning 200 {"ok":true,"affected":N,"id":...}.
- Import batches/rows list routes: live with pagination.

## Validate Quickly
1. **Batches**:  
   curl -H "x-admin-email: collabsbestie@gmail.com" https://api.bestiecollabs.com/api/admin/import/brands/batches?limit=5&offset=0
2. **Rows for latest batch**:  
   .../batches/{id}/rows?limit=5&offset=0
3. **Directory**:  
   curl -H "x-admin-email: collabsbestie@gmail.com" https://api.bestiecollabs.com/api/admin/brands?limit=10&offset=0
4. **Delete/Undo**:  
   POST /api/admin/brands/{id}/delete then POST /api/admin/brands/{id}/undo with admin header.

## Next 2 Tasks (Do Next)
1. **Unpublish Endpoint + UI**  
   - Add POST /api/admin/brands/:id/unpublish → UPDATE brands SET status='draft' WHERE id=?;  
   - Wire an **Unpublish** button beside Delete/Undo to call the endpoint and refresh the table.
2. **Commit Counts in Import**  
   - Update POST /api/admin/import/brands/batches/:id/commit to return { inserted, updated, skipped }.  
   - Surface counts in the Admin UI toast and auto-refresh batches + directory.

## Notes / Guardrails
- All admin endpoints must check the x-admin-email header.  
- Keep functions under /functions/api/* with _routes.json allowing /api/* and /api/debug/*.  
- Directory list must filter deleted_at IS NULL.  
- Pagination caps: limit <= 200.

## File Inventory Touched This Session
- unctions/api/admin/import/brands/batches/index.ts
- unctions/api/admin/import/brands/batches/[id]/rows.ts
- unctions/api/admin/brands/[id]/delete.ts
- unctions/api/admin/brands/[id]/undo.ts
- dmin/brands/table.js

