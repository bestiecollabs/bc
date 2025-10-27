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
* Add basic health checks; log errors with request IDs.
* Testing: include a smoke test or minimal repro for each feature; validate timestamps, time zones, and locale.
* For D1 queries, show schema assumptions and expected row counts.

## Handoff File Rules (for New Chats)

**PowerShell Compatibility**
Always provide full PowerShell-ready code blocks so I can run them directly in PowerShell. Always double check codes for accuracy.

**Full Code Delivery**
Always put the step #, include the full code, the exact file directory path, a clear explanation of what the code does, and what to expect after running it.

**Concise Instructions**
Provide short, direct, and detailed instructions for every step.

**Understand the Codebase First**
Before writing or editing code, review all files in the repo to understand the project structure and logic. If a needed file is missing, ask me for it immediately before continuing.

**Respect Existing Work**
This is a continuation from prior chats. Do not remove or override working features to land new changes.

**Maintain Consistent Structure**
Match existing file layout, naming, and coding conventions.

**No Backup or Variant Files**
Do not create .bak or variant files. Always provide clean code.

**Fix, Don’t Patch**
No temporary solutions. Identify root causes and update code cleanly.

## SOP
> Enforcement: All chats must follow the SOP exactly. If a conflict exists between prior instructions and the SOP, follow the SOP and note the conflict in the next message.
# SOP_SEED

## Goal
Keep the project stable while shipping small, verifiable steps.

## Standard Flow

1) **Change management**
   - Read target files fully.
   - Edit with full-file replacements only.
   - Keep code style and structure consistent.

2) **Deliverables**
   - Full code for changed files.
   - Exact paths.
   - Short what-it-does and what-to-expect notes.
   - One PowerShell script that writes all updated files (Seed included).

3) Local File Root Directory
   - C:\bc\cloudflare\html>