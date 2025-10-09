# AI_README.md

PROJECT
Bestie Collabs

STACK
- Static HTML and vanilla JS on Cloudflare Pages
- Cloudflare Pages Functions in /functions
- Cloudflare D1 database name bestiedb
- Domains: bestiecollabs.com and api.bestiecollabs.com
- Repo: https://github.com/bestiecollabs/bc  branch main
- Local root: C:\bc\cloudflare\html

PROD URLS
- App: https://bestiecollabs.com
- API: https://api.bestiecollabs.com
- Health: /api/healthcheck returns ok true

CURRENT CONFIG
- Build: Framework preset None, Build command empty, Output directory .
- Pages Functions: auto detected from /functions
- wrangler.toml manages plaintext vars and D1 binding
- OPENAI_API_KEY stored as Cloudflare Secret
- D1 binding variable name DB  database bestiedb
- Redirect: www.bestiecollabs.com to https://bestiecollabs.com/${1}
- SSL: Active Full

SEED RULES
- Full code delivery with exact file paths and what to expect
- Verify latest files before edits  ask if unsure
- Concise instructions
- Provide full code via PowerShell blocks
- Read files provided in chat before coding
- Do not remove features to make new code work
- Keep the same code structure  no new folders without approval
- No backups or variants  fix root causes
- Answer side questions then return to main task
- Production first  deploys from main

WHERE WE LEFT OFF
- GitHub to Cloudflare deploy verified
- API healthcheck works on both domains
- D1 binding aligned as env.DB

NEXT TWO TASKS
1. Verify /api/users/me returns ok true with session when logged in
2. Implement Admin Delete plus Undo for Brands and Creators in production

DO NOTS
- Do not change file structure
- Do not commit secrets
- Do not use React or Vite

