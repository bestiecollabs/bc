# Bestie Collabs

Public so an AI assistant can read files and help automate work on **bestiecollabs.com** and **api.bestiecollabs.com**.

## What this is
- Static site + Cloudflare Pages Functions
- D1 database: `bestiedb`
- Deploy branch: `main`

## Quick facts for assistants
- Local root: `C:\bc\cloudflare\html`
- Repo: `https://github.com/bestiecollabs/bc`
- Shell: PowerShell by default
- After any file change: show git add/commit and push to `main`

## Restore workflow (summary)
Make `main` match the chosen `restore/*` branch, push, then hard-reset local to `origin/main`.  
See `AI_README.md` for exact commands.

## Notes
- Keep `_headers`, `_redirects`, `b1.png`, `robots.txt`, `sitemap.xml` intact.
