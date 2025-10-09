# HANDOFF.md

We left off at: live deploy verified and API reachable at both domains. Next step is: verify /api/users/me and complete Admin Delete plus Undo.

ENV
- Cloudflare Pages project bc
- Domains bestiecollabs.com and api.bestiecollabs.com
- D1 database bestiedb  binding name DB
- Secrets in Cloudflare  OPENAI_API_KEY
- wrangler.toml controls vars and D1 binding

DEPLOY FLOW
1. Edit locally in C:\bc\cloudflare\html
2. git add -A  git commit  git push origin main
3. Cloudflare auto deploys

CHECKS
- https://api.bestiecollabs.com/api/healthcheck returns ok true
- Pages Custom Domains show Active and SSL enabled
- DNS has CNAME www to bestiecollabs.com and CNAME root to pages.dev
- Rules redirect www to root with ${1}

WORK RULES
- Full file paths and PowerShell blocks
- Minimal changes  no new folders without approval
- No patches  fix root causes

## Runtime Diagnostics (admin only)
- GET /api/health  → public JSON { ok }
- GET /api/db-health  → requires header x-admin-email; JSON { ok, db }
- GET /api/db-tables  → requires header x-admin-email; JSON { tables[] }
- GET /api/db-stats   → requires header x-admin-email; JSON { stats }

### D1 Tables observed
invites, brand_merge_map, d1_migrations, directory_creators, creators, directory_brands,
users, addresses, admin_batches, admin_audit, admin_recycle_bin, creator_merge_map, users_admin_meta.

### Notes
- No migrations recorded (d1_migrations max(id) = null). Plan: add baseline migration.
- Do not expose diagnostics publicly. Keep header gate.
