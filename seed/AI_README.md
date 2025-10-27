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

## Operational Rules

* PowerShell 7.5.3 required; use `$ErrorActionPreference='Stop'`; wrap critical steps in `try { } catch { }`.
* Use UTF-8 explicitly for file IO (`Out-File -Encoding utf8`, `Set-Content -Encoding utf8`).
* Provide rollback note with last known good commit for any deployed change.
* If mojibake, issues or errors are detected, let me know.

## Handoff File Rules (for New Chats)

**PowerShell Compatibility**
Always provide full PowerShell-ready code blocks so I can update or run them directly in PowerShell.

**Full Code Delivery**
Always put the step #, include the full code, the exact file directory path, a detailed explanation of what the code does, and what to expect after running it.

**Understand the Codebase First**
Before writing or editing code, review all files in the repo to understand the project structure and logic. If a needed file is missing, check with me.

**Respect Existing Work**
This is a continuation from prior chats. Do not remove or override working features to land new changes.

**Maintain Consistent Structure**
Match existing file layout, naming, and coding conventions.

**No Backup or Variant Files**
Do not create .bak or variant files. Update only the intended files with clean code..

**Fix, Don’t Patch**
No temporary solutions. Identify root causes. Update code and files cleanly.

> Enforcement: All chats must follow the SOP exactly. If a conflict exists, follow the SOP and note the conflict.

1) **Change management**
   - Read target files fully.
   - Edit with full-file replacements only.
   - Keep code style and structure consistent.

2) **Deliverables**
   - Don't guess.
   - Double check the code for accuracy before you give them to me.
