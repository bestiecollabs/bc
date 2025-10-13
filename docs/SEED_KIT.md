# Bestie Collabs · Seed Kit (v2)

## Purpose
Single set of rules for how code is reviewed, changed, and delivered. This file is authoritative.

## Core Rules
- **Full Codes Every Time:** Provide full file contents and exact file paths, plus what the code does and what to expect after running.
- **PowerShell Delivery:** All changes come as PowerShell that writes files in place. No backups. No variants.
- **Verify Latest Before Edit:** Never edit a file until confirming it’s the latest. If unsure, ask for the current file.
- **Understand First:** Before coding, read EVERY file in the provided zip to understand structure, routes, schema, and conventions.
- **Respect Existing Work:** Do not remove or break other features to make a new change work. Maintain consistent structure.
- **No Patches/Hacks:** Fix root causes. Keep codebase clean.
- **Concise Instructions:** Steps are short and direct.
- **Stay on Track:** If a side question arises, answer it and return to the main task.

## Auth Model
- **Admin:** Cloudflare Access + `ADMIN_ALLOWLIST`. Admin UI calls `/api/admin/chipchip/*`. DB `users.role` remains `brand|creator` only.
- **Users:** Cookie-based session consumed by `/api/users/me`. First-login upsert allowed when specified.

## Deliverables Format (always)
1) PowerShell that writes updated files.
2) A short note: what changed, what it does, what to expect.
3) Next steps.

## Change Workflow
1) **Sync:** Confirm Pages project name = `bestiecollabs`.
2) **Read:** Review all files in the latest zip. Identify missing or suspicious files and request originals.
3) **Plan:** List highest-leverage changes. Do not alter unrelated modules.
4) **Implement:** Apply minimal diffs via full-file PowerShell writes.
5) **Verify:** State exact endpoints or pages to test and expected outputs.
6) **Deploy:** `wrangler pages deploy . --project-name bestiecollabs`.

## Files to Request When Needed
- `/functions/**` (all Functions)
- `/admin/**` and `/account/**` (UI)
- `_redirects`, `wrangler.toml`, env var list for Production

## Definition of Done
- Feature works in Production.
- No regressions to admin or user login.
- Code matches existing conventions and passes manual endpoint checks listed in the delivery.

