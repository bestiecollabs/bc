# Bestie Collabs — Admin Panel Handoff

## D1 bindings
- Local dev (Pages dev): **bestiedb**
  - Run: `wrangler pages dev . --d1=bestiedb --port 8788`
- Production (Pages): **DB** (as in Cloudflare UI)

## Code contract
- All Functions use `(env.bestiedb || env.DB)` for D1 access.
- No redirects. No migrations.

## Auth
- Prod: Cloudflare Access required on `/admin/*` and `/api/admin/*`.
- Dev: `.dev.vars` enables header/cookie for `/api/users/me` only.

## Endpoints
- GET `/api/admin/chipchip/brands`
- GET `/api/admin/chipchip/creators`
- GET `/api/admin/chipchip/users/`  ← trailing slash required
- POST `/api/admin/chipchip/undo`

## Notes
- Delete → recycle → undo works and is audited.
- Password login is disabled until `users.pw_salt` and `users.pw_hash` exist.
