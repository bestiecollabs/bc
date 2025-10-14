#! handoff.md - v3.2 (2025-10-14 01:28 PST)

We left off: Cloudflare deploy is green, Functions compile.

## Environment
- Pages project: bc
- Domains: bestiecollabs.com, api.bestiecollabs.com
- Preview pattern: *.bc-ezy.pages.dev
- D1: bestiedb (binding DB)
- Repo: branch main @ 9cfcaee

## Deploy flow
1) Edit locally in C:\bc\cloudflare\html
2) git add -A && git commit -m "msg" && git push origin main
3) Cloudflare auto-deploys (Functions from /functions)

## Verify
- GET /api/healthcheck -> { ok: true }
- Custom domains Active, SSL Full
- No wrangler parse/BOM errors

## Guardrails
- PowerShell-first. Full files. Exact paths. Keep structure and names.
- Production-first on main. Explain what it does and what to expect.
- New Chat Rule: Every new chat must read the current GitHub codebase before any work.

## Rollback & Tags
- Tag stable: git tag v0.1-setup-clean && git push origin --tags
- Rollback: git revert <sha>  or deploy previous commit in Cloudflare

## Resuming a session
1) Load seed/state.json and seed/resume.md
2) Confirm handoff timestamp and tasks
3) Run scripts/update-seed.ps1
4) Start with "Next 2 tasks"

## Next 2 tasks (do now)
1) Finish brand import feature (dry-run + commit, clear report)
2) Create public brand directory (/brands/) with list + detail