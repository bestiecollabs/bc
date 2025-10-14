# AI_README — Bestie Collabs (Pages project: **bc**)

**Latest active session:** 2025-10-13T00:00:00Z

## Current facts
- Git: branch `main`, sha `a0ba134`
- Wrangler: 4.42.1
- Domains: bestiecollabs.com, api.bestiecollabs.com
- Latest preview: https://356f3677.bc-ezy.pages.dev
- Admin allowlist detected: true (length=23)
- Admin whoami allowed (colla***@gmail.com): true

## Admin APIs
- `/api/admin/whoami`
- `/api/admin/chipchip/brands/{list|delete|undo}`
- `/api/admin/chipchip/creators/{list|delete|undo}`
- `/api/admin/chipchip/recycle-bin/list`
- `/api/ping`
- `/api/admin/debug-env`

## Deploy
- Production: `wrangler pages deployment create . --project-name bc --commit-dirty=true`
- Preview: `wrangler pages deploy . --project-name bc`

## Secrets (prod)
- `ADMIN_ALLOWLIST` — required
- `ADMIN_ALLOW_ANY` — `"0"` in production

## Notes
- Custom domains are mapped and live. Admin endpoints gated by allowlist. D1 database: `bestiedb`.
