# Bestie Collabs — Seed Instructions (Admin Panel)

## Stable Local Dev
- Pages root: html
- Functions dir: html/functions
- Command: wrangler pages dev . --d1=bestiedb --port 8788

## D1 Bindings
- Production (Pages UI): binding DB -> database bestiedb (UUID ends ...2403)
- Local (wrangler pages dev): binding bestiedb
- Code must use: (env.bestiedb || env.DB)

## Do Not Do
- Do not change binding names, dev port, or flags.
- Do not add migrations or redirects.

## Auth Policy
- Production: protect /admin/* and /api/admin/* with Cloudflare Access. Set ADMIN_ALLOWLIST=collabsbestie@gmail.com. Do not set ADMIN_DEV_HEADER_OK.
- Dev: .dev.vars must include:
  ADMIN_ALLOWLIST=collabsbestie@gmail.com
  ADMIN_DEV_HEADER_OK=1
  /api/users/me accepts CF Access email, x-admin-email header, or dev cookie dev_email=<address>.

## Admin APIs
- GET /api/admin/chipchip/brands
- GET /api/admin/chipchip/creators
- GET /api/admin/chipchip/users/   (trailing slash required)
- POST /api/admin/chipchip/undo

## Data Model Notes
- admin_recycle_bin columns in use: id, entity_table, entity_id, before_json, batch_id, created_at
- Delete -> recycle -> undo works. Undo writes admin_audit with action=undo.

## Login Endpoint
- /api/account/password disabled until users.pw_salt and users.pw_hash exist. Returns { ok:false, error:"password_auth_disabled" }.

## Seed Rules
1) Full Code Delivery: full file + path + what it does + what to expect.
2) File Verification: confirm latest file before edits.
3) Concise Instructions: short, direct steps.
4) PowerShell Compatibility: write files in place.
5) Understand First: read all files before coding; ask for missing files.
6) Respect Existing Work: keep structure and names; fix root causes only.

## Common Pitfalls
- 308 on folder route: use /api/admin/chipchip/users/
- Binding mismatch: prod DB vs local bestiedb; always use (env.bestiedb || env.DB)
