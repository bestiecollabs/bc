# HANDOFF.md

We left off at: live deploy verified and API reachable at both domains. Next step is: verify /api/users/me and complete Admin Delete plus Undo.

ENV
- Cloudflare Pages project bc
- Domains bestiecollabs.com and api.bestiecollabs.com
- D1 database bestiedb  binding name DB
- Secrets in Cloudflare  OPENAI_API_KEY
- wrangler.toml controls vars and D1 binding

DEPLOY FLOW
1. Edit locally in C:\bc\cloudflare\html
2. git add -A  git commit  git push origin main
3. Cloudflare auto deploys

CHECKS
- https://api.bestiecollabs.com/api/healthcheck returns ok true
- Pages Custom Domains show Active and SSL enabled
- DNS has CNAME www to bestiecollabs.com and CNAME root to pages.dev
- Rules redirect www to root with ${1}

WORK RULES
- Full file paths and PowerShell blocks
- Minimal changes  no new folders without approval
- No patches  fix root causes
