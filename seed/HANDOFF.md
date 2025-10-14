# Handoff — Bestie Collabs (project: bc)

**Session:** 2025-10-13T00:00:00Z • Git main@a0ba134

## Artifacts
- `/seed/RESUME.md` — human summary
- `/seed/AI_README.md` — working notes and commands
- `/seed/CHANGELOG_AI.md` — running log
- `/seed/state.json` — machine state (not included here)
- `/seed/ai_tree.txt` — file inventory (optional refresh)

## Ground truth
- Pages project: `bc`
- Domains: bestiecollabs.com, api.bestiecollabs.com
- Latest preview: https://356f3677.bc-ezy.pages.dev
- D1: `bestiedb`
- Admin allowlist: present (len=23). `whoami` for colla***@gmail.com → allowed=true.

## Immediate next steps
1. Scaffold admin dashboard UI with left navigation and placeholder routes:
   - Dashboard, Brands, Creators, Recycle Bin, Settings.
2. Implement CSV brand import endpoint + UI stub.
3. Build Brand Directory list with filters.
4. Creator CSV import + Creator Directory.
5. Confirm `ADMIN_ALLOW_ANY="0"` on prod before each deploy.

## Ops reminders
- Prod deploy: `wrangler pages deployment create . --project-name bc --commit-dirty=true`
- Preview: `wrangler pages deploy . --project-name bc`
- Secrets: set on prod only. Do not store values in repo.
