# AI_README

Project: Bestie Collabs

Scope: Admin + Creator/Brand directory. Cloudflare Pages (frontend) + Cloudflare Workers API (backend) + Cloudflare D1.

## Tech Stack

* Frontend: HTML, CSS, JavaScript only.
* Hosting: Cloudflare Pages (project: bestiecollabs).
* Backend: Cloudflare Workers (API: [https://api.bestiecollabs.com](https://api.bestiecollabs.com)).
* Database: Cloudflare D1 (database: bestiedb; binding: DB).
* Auth: Cloudflare Access service token `bc_admin_gpt` with policy "Allow service token".
* OAuth: callback at `/auth/callback` on api.bestiecollabs.com.
* Cron: 1st and 15th at 1:45 AM PST with UTC guard.
* Assets: `b1.png` in repo root.

## Environments and URLs

* Production site: [https://bestiecollabs.com](https://bestiecollabs.com)
* Production API: [https://api.bestiecollabs.com](https://api.bestiecollabs.com)

## Repo and Deployment

* GitHub: [https://github.com/bestiecollabs/bc](https://github.com/bestiecollabs/bc)
* Deploy branch: `main` (push to `main` to deploy).
* Integration Stability Rule: do not break existing behavior.
* Do not rename, restructure, or create variant files without permission.

## Current State (resuming point "Project Root")

* Admin endpoints live: `/api/admin/chipchip/*`
* Delete + Undo working for brands and creators
* Minimal Admin UI: `/admin/index.html` and `/admin/admin.js`
* D1 schema stable (`admin_recycle_bin` includes: `id`, `admin_email`, `action`, `entity_table`, `entity_id`, `before_json`, `after_json`, `batch_id`, `created_at`, `ts`)

## Operational Rules

* PowerShell 7.5.3 required; use `$ErrorActionPreference='Stop'`; wrap critical steps in `try { } catch { }`.
* Use UTF-8 explicitly for file IO (`Out-File -Encoding utf8`, `Set-Content -Encoding utf8`).
* Provide rollback note with last known good commit for any deployed change.
* Add basic health checks; log errors with request IDs.
* Testing: include a smoke test or minimal repro for each feature; validate timestamps, time zones, and locale.
* For D1 queries, show schema assumptions and expected row counts.

## Continuity Files

**CHANGELOG_AI**

* Record each material change by date/time (PST), author/model, files touched, diffs or summaries, rationale, tests run, impact, rollback notes, and PR links.

**HANDOFF**

* Capture current state, open decisions, blockers, next actions, env bindings (no secrets), build/test steps, known issues, owners, deadlines, and pointers to AI_README and CHANGELOG_AI entries.
* Refresh at every shift change, task pause, or transfer.

## Handoff File Rules (for New Chats)

**PowerShell Compatibility**
Always provide full PowerShell-ready code blocks so I can update or run them directly in PowerShell.

**Full Code Delivery**
Always put the step #, include the full code, the exact file directory path, a clear explanation of what the code does, and what to expect after running it.

**File Verification**
Before updating any code, verify you have the latest version. If not, ask me to provide the most recent file before making changes.

**Concise Instructions**
Provide short, direct, and clear instructions for every step.

**Understand the Codebase First**
Before writing or editing code, review all files in the repo to understand the project structure and logic. If a needed file is missing, ask me for it immediately before continuing.

**Respect Existing Work**
This is a continuation from prior chats. Do not remove or override working features to land new changes.

**Maintain Consistent Structure**
Match existing file layout, naming, and coding conventions.

**No Backup or Variant Files**
Do not create .bak or variant files. Update only the intended files.

**Fix, Don’t Patch**
No temporary hacks. Identify root causes and update code cleanly.

## SOP
> Enforcement: All chats must follow the SOP exactly. If a conflict exists between prior instructions and the SOP, follow the SOP and note the conflict in the next message.
# SOP_SEED

## Goal
Keep the project stable while shipping small, verifiable steps.

## Standard Flow

1) **Pull latest artifacts**
   - Use the newest zip from the user.
   - Confirm file timestamps match.

2) **Start local**
   - `wrangler pages dev . --port=8788`
   - Use `x-admin-email` for admin routes during local development.

3) **Validate baseline**
   - `GET /health`
   - `GET /api/admin/ping` (with header)
   - `GET /api/admin/chipchip/brands?limit=5` (with header)

4) **Change management**
   - Read target files fully.
   - Edit with full-file replacements only.
   - Keep code style and structure consistent.

5) **Test**
   - Exercise endpoints touched by the change.
   - If D1 schema errors occur, adjust schema via explicit migrations and update code accordingly.

6) **Deliverables**
   - Full code for changed files.
   - Exact paths.
   - Short what-it-does and what-to-expect notes.
   - One PowerShell script that writes all updated files (Seed included).

## Notes
- Routes under Pages dev are `/api/...` not `/functions/api/...`.
- Avoid backups or file variants.
