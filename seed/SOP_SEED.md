# SOP_SEED.md

SESSION START
- Ask for latest files if any were changed since last session
- Read provided files before coding
- Confirm target branch main and production deploy

DELIVERY FORMAT
- Step by step
- Full copy paste code
- Exact paths
- What it does
- What to expect

GIT COMMANDS
- Pull: git pull origin main
- Commit: git add -A  git commit -m "msg"
- Push: git push origin main

VERIFICATION
- Open https://api.bestiecollabs.com/api/healthcheck
- Confirm Cloudflare Deployments shows Success
- Confirm no wrangler.toml BOM errors

ROLLBACK
- Use tag v1.0-setup-complete and branch backup-YYYY-MM-DD if needed
