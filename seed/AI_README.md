# AI_README

Project: Bestie Collabs  
Scope: Admin + Creator/Brand directory, Cloudflare Pages + Functions (D1)  
Current State (resuming point “Project Root”):
- Admin endpoints live: /api/admin/chipchip/*
- Delete + Undo working for brands and creators
- Minimal Admin UI: /admin/index.html + /admin/admin.js
- D1 schema stable (admin_recycle_bin includes: id, admin_email, action, entity_table, entity_id, before_json, after_json, batch_id, created_at, ts)

## Handoff File Rules (for New Chats)

**Full Code Delivery**  
Always include the full code, the exact file directory path, a clear explanation of what the code does, and what to expect after running it.

**File Verification**  
Before updating any code, verify you have the latest version. If not, ask me to provide the most recent file before making changes.

**Concise Instructions**  
Provide short, direct, and clear instructions for every step.

**PowerShell Compatibility**  
Always provide full PowerShell-ready code blocks so I can update or run them directly in PowerShell.

**Understand the Codebase First**  
Before writing or editing code, review all files in the provided zip to understand the project structure and logic.  
If a needed file is missing, ask me for it immediately before continuing.

**Respect Existing Work**  
This is a continuation from prior chats. Do not remove or override working features to land new changes.

**Maintain Consistent Structure**  
Match existing file layout, naming, and coding conventions.

**No Backup or Variant Files**  
Do not create .bak or variant files. Update only the intended files.

**Fix, Don’t Patch**  
No temporary hacks. Identify root causes and update code cleanly.

**Deliver Seed via PowerShell (New Requirement)**  
From now on, every handoff must include a PowerShell script that writes the updated Seed Kit files exactly as delivered here.

## How to Run Locally (reference)
- Start: `wrangler pages dev . --port=8788`
- Admin header in dev: `x-admin-email: collabsbestie@gmail.com`
- Admin routes are under `/api/admin/...` (no `/functions` prefix)