# SOP_SEED.md

SESSION START
- Pull latest: git pull origin main
- Confirm local root: C:\bc\cloudflare\html
- Confirm wrangler.toml is UTF-8 (no BOM) and pages_build_output_dir="cloudflare/html"

DELIVERY FORMAT
- Step-by-step
- Full copy-paste code
- Exact paths
- What it does + What to expect
- PowerShell-first

VERIFY
- Cloudflare Deployments: build success, functions compiled
- /api/healthcheck returns ok
- No TOML BOM error in logs
- Live HTML equals repo (cache-busted GET)

ROLLBACK
- Tag stable points before risky changes (e.g., v1.0-setup-complete)
- If needed, create backup-YYYY-MM-DD branch

NOTES
- Admin-only diagnostics must stay gated via header checks
- Do not commit .dev.vars or any secrets
