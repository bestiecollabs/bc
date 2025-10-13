# AI_README.md

PROJECT
- Bestie Collabs

STACK
- Static HTML + vanilla JS on Cloudflare Pages
- Pages Functions in /functions
- D1 database bestiedb (binding DB)
- Repo: https://github.com/bestiecollabs/bc  branch main
- Local root: C:\bc\cloudflare\html

PROD URLS
- App: https://bestiecollabs.com
- API: https://api.bestiecollabs.com
- Health: /api/healthcheck → { ok: true }

CONFIG
- Build command: empty
- Output directory: .
- Functions: auto from /functions
- wrangler.toml controls D1 binding and plaintext vars (UTF-8 no BOM)
- OPENAI_API_KEY stored as Cloudflare Secret

SEED RULES (from handoff)
- Q&A first when starting a new task
- Full code via PowerShell. Exact paths. No backups or temp files.
- Minimal edits. No new folders without approval.
- No patches; address root cause.
- Keep code style and structure consistent.
- Deploy from main. Verify deployment UI and health endpoints.

NEXT TASKS
1) Admin/Dashboard scaffold at /dashboard/ with session-based welcome
2) Brands CSV import UI → calls /api/admin/brands/import and reports inserted/skipped/failed

## Quick Commands
git pull --rebase origin main
git add -A && git commit -m "msg" && git push origin main
# Tag:
git tag v0.1-setup-clean && git push origin --tags
