[AI_README 2025-10-13 12:56 PST]  — Latest Active Session

PROJECT
- Bestie Collabs (production-first on Cloudflare Pages + Functions).

STACK & HOSTING
- Frontend: static HTML + vanilla JS.
- Server: Cloudflare Pages Functions in /functions.
- Database: Cloudflare D1 — **bestiedb** (binding DB).
- Domains: **bestiecollabs.com**, **api.bestiecollabs.com**.
- SSL: Full (Cloudflare managed).
- Repo: https://github.com/bestiecollabs/bc  (branch: main)
- Local root: C:\bc\cloudflare\html

CONFIG (verified)
- wrangler.toml is UTF-8 (no BOM), pages_build_output_dir = "cloudflare/html".
- Pages auto-deploys from **main**. Functions auto-detected from /functions.
- Cloudflare Secret: **OPENAI_API_KEY**.
- D1 binding: DB → bestiedb (id: 7ccf7968-cb51-4001-a81b-ca235b8d2403).

HEALTH
- GET https://api.bestiecollabs.com/api/healthcheck → { "ok": true }
- Deployments UI: green. DNS: apex flattened, www CNAME → root.

LATEST CHANGES
- Fixed wrangler BOM error and output-dir mismatch.
- Functions build fixed; import path for admin chipchip resolved.
- Removed repo artifacts (i_artifacts/, .dev.vars*) and hardened .gitignore.
- UI: password eye icon stabilized; restored color and hover behavior.

NEXT TWO TASKS (PRIORITY)
1) Build /admin/dashboard/ shell with session guard + brand KPIs.
2) Brands CSV import report UI wired to /api/admin/brands/import (dry-run + commit).

WORK RULES (v3.0)
- PowerShell-first delivery. Full file contents. Exact paths. No patches/backups.
- Keep structure and names. Production-only on main.
- Every change explains “what it does” and “what to expect”.
- Small, verifiable increments.

---# AI_README.md

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

