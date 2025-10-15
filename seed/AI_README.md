[AI_README 2025-10-15 10:50 PST]  // v3.0 handoff ? part 1 of 2 ? LATEST ACTIVE SESSION
Scope: Persist authoritative, production-first context for Bestie Collabs.
Owner: Dao / bestiecollabs.com
Environment: Cloudflare Pages project "bc" (domains: bestiecollabs.com, api.bestiecollabs.com), D1 "bestiedb" (binding: DB).

Key Rules (v3.0):
- Production-first. Deploy via git push to main; Wrangler only for hotfixes.
- No renames/restructures without approval; complete files only (no diffs).
- Keep running logs: AI_README (prepend), CHANGELOG_AI (append), HANDOFF snapshot when applicable.

What?s new this session:
- Removed duplicate admin page: /admin/brands/import ? 301 to /admin/brands/.
- Confirmed admin gating via Access; set ADMIN_ALLOW_ANY=0 for prod.
- Hardened scripts/deploy-prod.ps1 with preflights and safe ahead/behind parsing.
- Retired scripts/deploy-preview.ps1; prod-only workflow.

Operational: 
- CSV Import lives at /admin/brands/ and is the canonical UI.
- Redirects enforced in _redirects for /admin/brands/import and /admin/brands/import.html ? /admin/brands/.
- Deploy: scripts/deploy-prod.ps1 (preferred: push to main). Wrangler hotfix allowed with -Wrangler.
- Verification endpoints: 
  - GET https://api.bestiecollabs.com/api/admin/debug-env  (checks allowlist secret presence)
  - GET https://api.bestiecollabs.com/api/admin/whoami    (allowed=false when not on allowlist)

Next Focus (part 2 of 2, upcoming):
- Finalize Admin Dashboard shell and KPIs.
- CSV import UX polish: clearer per-row messages and post-commit surface area.

This block supersedes earlier context and is the authoritative live state at the time above.

[AI_README 2025-10-14 22:29 PST]
Context: Cloudflare Pages project = bc. Branch = main. Commit = a118ead4744074e7ff965761ac0110b8d724b18a.
Today?s work:
- Fixed template-agent Worker: correct 11-column Brand Template + filename.
- Cleaned Admin/Brands page copy; aligned accepted headers to Agent list.
- Added dry-run analyzer endpoint (/api/admin/import/brands/analyze) and UI.
- Verified Worker via PowerShell test. Purged caches. Confirmed behavior.

Final Brand Template headers:
brand_name,website_url,category_primary,category_secondary,category_tertiary,instagram_url,tiktok_url,description,customer_age_min,customer_age_max,us_based

Next 2 Tasks:
1) Commit pipeline for imports: turn dry-run results into upsert (dry-run + commit with clear report).
2) Public /brands directory: list + detail pages sourced from DB.

---
[AI_README 2025-10-14 22:26 PST]
Context: Cloudflare Pages project = bc. Branch = main. Commit = a118ead4744074e7ff965761ac0110b8d724b18a.
Today?s work:
- Fixed template-agent Worker: correct 11-column Brand Template + filename.
- Cleaned Admin/Brands page copy; aligned accepted headers to Agent list.
- Added dry-run analyzer endpoint (/api/admin/import/brands/analyze) and UI.
- Verified Worker via PowerShell test. Purged caches. Confirmed behavior.

Final Brand Template headers:
brand_name,website_url,category_primary,category_secondary,category_tertiary,instagram_url,tiktok_url,description,customer_age_min,customer_age_max,us_based

Next 2 Tasks:
1) Commit pipeline for imports: turn dry-run results into upsert (dry-run + commit with clear report).
2) Public /brands directory: list + detail pages sourced from DB.

---

