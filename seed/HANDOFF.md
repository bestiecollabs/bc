# HANDOFF.md — Active Handoff (2025-10-13 12:56 PST)

We left off at: Cloudflare deploy is green, Functions compile, emojis fixed.  
Next focus: **Admin Dashboard** + **Brands CSV import report UI**.

## Environment
- Pages project: **bc**
- Domains: **bestiecollabs.com**, **api.bestiecollabs.com**
- D1: **bestiedb** (binding DB)
- Secrets: **OPENAI_API_KEY** (Cloudflare)
- wrangler: UTF-8 (no BOM), pages_build_output_dir="cloudflare/html"

## Deploy flow
1) \git pull --rebase origin main\
2) Edit locally in **C:\bc\cloudflare\html**
3) \git add -A && git commit -m "msg" && git push origin main\
4) Cloudflare auto-deploys (Functions from \/functions\)

## Verify
- \GET /api/healthcheck\ → \{ ok:true }\
- Custom domains Active, SSL Full, DNS apex flattened + www CNAME.
- No wrangler parse/BOM errors in deploy logs.

## Guardrails (Rules v3.0)
- PowerShell-first. Full files. Exact paths. No patches/backups.
- Keep structure and names. Production-first on main.
- Explain “what it does / what to expect”.

## Next 2 tasks (do now)
1) \/admin/dashboard/\ shell + session guard (non-admin → /login). KPIs from D1.
2) CSV import UI → \POST /api/admin/brands/import\ with dry-run + commit, show inserted/skipped/failed.

