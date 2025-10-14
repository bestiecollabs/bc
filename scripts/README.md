# Scripts

## Deploy
- deploy-prod.ps1  
  Default: push to main. Blocks if not on main, if dirty, or behind origin.  
  Hotfix: add -Wrangler to force a Pages production deployment from the working copy.

- deploy-preview.ps1  
  Creates a preview deployment on project "bc".

- get-preview.ps1  
  Reads seed/state.json for preview_pattern and returns the latest preview URL parsed from Wrangler output.

## Seed
- update-seed.ps1  
  Preflights repo, git, and wrangler. Runs:
  seed-write-state -> seed-write-ai-readme -> seed-write-handoff -> seed-write-resume -> seed-write-tree -> seed-append-changelog.

- seed-write-*.ps1 / seed-append-changelog.ps1  
  Idempotent. No secrets. ASCII only.

## Rules
- Production-first. Deploy by pushing to main. Wrangler only for hotfixes.
- No renames or restructures without approval.
- Keep .ps1 files ASCII and CRLF.