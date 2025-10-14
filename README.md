# Bestie Collabs – Cloudflare Pages (project: **bc**)

- Project name: \c\
- Custom domains: \estiecollabs.com\, \pi.bestiecollabs.com\
- Preview domain pattern: \*.bc-ezy.pages.dev\

## Deploy

### Production
wrangler pages deployment create . --project-name bc --commit-dirty=true

### Preview (no domain switch)
wrangler pages deploy . --project-name bc

## Secrets (Production)
wrangler pages secret put ADMIN_ALLOWLIST --project-name bc
wrangler pages secret put ADMIN_ALLOW_ANY  --project-name bc   # usually "0"

## Admin endpoints (require allowlist)
- /api/admin/whoami
- /api/admin/chipchip/brands/{list|delete|undo}
- /api/admin/chipchip/creators/{list|delete|undo}
- /api/admin/chipchip/recycle-bin/list
