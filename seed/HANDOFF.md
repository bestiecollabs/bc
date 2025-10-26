# HANDOFF

We are resuming from the last confirmed working state (“Project Root”).
- Backend stable. Brands/Creators delete + undo work.
- Admin UI exists at /admin/ and talks to /api/admin/chipchip/*.

## For the Next Chat

1) **Confirm starting point**  
   Acknowledge we are resuming from “Project Root” and list any local edits you intend to make.

2) **Verify files first**  
   Ask for the latest zip if you suspect drift. Do not modify until you have the newest files.

3) **Always deliver code completely**  
   - Provide full file contents and exact paths.
   - Explain what each change does and what to expect after running.

4) **PowerShell-first delivery**  
   Provide a single PowerShell script that writes the updated files in-place. No backups or temp files.

5) **Consistency**  
   - Keep structure and naming consistent with existing code.
   - Do not delete other features to make yours work.

6) **Admin header requirement**  
   Local dev must set `x-admin-email`. In production, Cloudflare Access will provide identity.

7) **No patches**  
   If something breaks, identify the root cause and fix the real code.

## Minimal Smoke Tests

- Health: `GET /health`
- Admin DB ping: `GET /api/admin/ping` with header
- Brands list: `GET /api/admin/chipchip/brands?limit=5` with header
- Soft delete + undo on one id

## Ready-To-Run Seed Delivery (required)
All future handoffs must include the complete Seed Kit using a PowerShell script like this file provides.