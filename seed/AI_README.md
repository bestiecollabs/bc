#! ai_readme.md - Active Snapshot (2025-10-14 01:30 PST)

PROJECT
- Bestie Collabs

STACK
- Static HTML + vanilla JS on Cloudflare Pages
- Pages Functions in /functions
- D1 database bestiedb (binding DB)
- Repo: https://github.com/bestiecollabs/bc  branch main  sha f1aa8f6
- Local root: C:\bc\cloudflare\html

PROD URLS
- App: https://bestiecollabs.com
- API: https://api.bestiecollabs.com
- Health: /api/healthcheck -> { ok: true }

SEED RULES (excerpt)
- Step-by-step. Full file contents. Exact paths. PowerShell-first.
- No patches. Fix root causes. Keep structure and names.
- Production-first. Deploy by pushing main.
- New Chat Rule: Every new chat must read the current GitHub codebase and confirm the rules before writing any code.

NEXT TASKS
1) Finish brand import feature (dry-run + commit, clear report)
2) Create public brand directory (/brands/) with list + detail

---