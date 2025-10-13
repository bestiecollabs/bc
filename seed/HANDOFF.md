# HANDOFF.md

We left off at: Cloudflare Pages deploy is green. Emojis fixed. Functions build succeeds.  
Next: start Admin/Dashboard and Brands import flow.

ENV
- Cloudflare Pages project: bc
- Domains: bestiecollabs.com, api.bestiecollabs.com
- D1 database: bestiedb  (binding: DB)
- Secrets in Cloudflare: OPENAI_API_KEY
- wrangler.toml: pages_build_output_dir = "cloudflare/html" (UTF-8, no BOM)

DEPLOY FLOW
1) Edit locally in C:\bc\cloudflare\html
2) git pull origin main
3) git add -A && git commit -m "msg" && git push origin main
4) Cloudflare auto-deploys (root = cloudflare/html). Functions auto-detected from /functions.

CHECKS
- https://api.bestiecollabs.com/api/healthcheck → { ok: true }
- Pages → Custom domains “Active”, SSL “Full”
- DNS → CNAME www → bestiecollabs.com, apex flattened to Pages
- Retry deployment shows no wrangler TOML parse/BOM errors

WORK RULES
- Step-by-step. Full file contents. Exact paths. PowerShell-first delivery.
- No patches. Fix root causes in real files.
- Keep structure and names. No new folders without approval.
- Production-first. Main branch only.
- Small, verifiable changes. Explain “what it does” and “what to expect”.

WHERE TO BUILD NEXT
- /dashboard/ entry with session guard
- Admin CSV import UX for Brands → POST /api/admin/brands/import
