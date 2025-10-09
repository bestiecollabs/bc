Changes:
- Logo path fixed to "b1.png" (no leading slash). No file moves or renames.
- Header nav limited to: Brands, Creators, Pricing, Support.
- Unified button sizing and gradient across site.
- Removes old headers/footers; injects new ones on all pages.
- Forces UTF-8 and cleans mojibake on /terms, /support, /privacy and elsewhere.

Install:
1) Unzip into C:\bc\cloudflare\html
2) PowerShell:
   Set-ExecutionPolicy -Scope Process Bypass
   .\replace-chrome-v6.ps1 -Root "C:\bc\cloudflare\html"
3) Deploy:
   cd C:\bc\cloudflare\html
   wrangler pages deploy . --project-name=bestiecollabs

Verify:
- Logo shows. Header appears sitewide with 4 links.
- Buttons match size.
- No strange characters in legal pages.
