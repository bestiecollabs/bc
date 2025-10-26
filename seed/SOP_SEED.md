# SOP_SEED

## Goal
Keep the project stable while shipping small, verifiable steps.

## Standard Flow

1) **Pull latest artifacts**
   - Use the newest zip from the user.
   - Confirm file timestamps match.

2) **Start local**
   - `wrangler pages dev . --port=8788`
   - Use `x-admin-email` for admin routes during local development.

3) **Validate baseline**
   - `GET /health`
   - `GET /api/admin/ping` (with header)
   - `GET /api/admin/chipchip/brands?limit=5` (with header)

4) **Change management**
   - Read target files fully.
   - Edit with full-file replacements only.
   - Keep code style and structure consistent.

5) **Test**
   - Exercise endpoints touched by the change.
   - If D1 schema errors occur, adjust schema via explicit migrations and update code accordingly.

6) **Deliverables**
   - Full code for changed files.
   - Exact paths.
   - Short what-it-does and what-to-expect notes.
   - One PowerShell script that writes all updated files (Seed included).

## Notes
- Routes under Pages dev are `/api/...` not `/functions/api/...`.
- Avoid backups or file variants.