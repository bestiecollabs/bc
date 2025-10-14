# SOP_SEED.md

SESSION START
- Pull latest: git pull origin main
- Confirm local root: C:\bc\cloudflare\html
- Confirm wrangler.toml is UTF-8 (no BOM), pages_build_output_dir="."
- Trigger to regenerate docs: "prepare for a handoff"

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

ROLLBACK
- Tag stable: git tag v0.1-setup-clean && git push origin --tags
- Revert: git revert <sha>  or redeploy previous commit in Cloudflare

NOTES
- Admin-only diagnostics stay gated
- Do not commit .dev.vars or any secrets
- New Chat Rule: Every new chat must read the current GitHub codebase and confirm understanding of the rules **before** writing any code. No work starts until the repo context is acknowledged in-chat.