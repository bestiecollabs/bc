# HANDOFF.md — v3.1 ()

We left off: Cloudflare deploy is green, Functions compile.  
Next: **Admin Dashboard** + **Brands CSV import UI**.

## Environment
- Pages project: bc
- Domains: bestiecollabs.com, api.bestiecollabs.com
- Preview pattern: *.bc-ezy.pages.dev
- D1: bestiedb (binding DB)
- Repo: branch usage: git [-v | --version] [-h | --help] [-C <path>] [-c <name>=<value>] [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path] [-p | --paginate | -P | --no-pager] [--no-replace-objects] [--no-lazy-fetch] [--no-optional-locks] [--no-advice] [--bare] [--git-dir=<path>] [--work-tree=<path>] [--namespace=<name>] [--config-env=<name>=<envvar>] <command> [<args>]  These are common Git commands used in various situations:  start a working area (see also: git help tutorial) clone      Clone a repository into a new directory init       Create an empty Git repository or reinitialize an existing one  work on the current change (see also: git help everyday) add        Add file contents to the index mv         Move or rename a file, a directory, or a symlink restore    Restore working tree files rm         Remove files from the working tree and from the index  examine the history and state (see also: git help revisions) bisect     Use binary search to find the commit that introduced a bug diff       Show changes between commits, commit and working tree, etc grep       Print lines matching a pattern log        Show commit logs show       Show various types of objects status     Show the working tree status  grow, mark and tweak your common history backfill   Download missing objects in a partial clone branch     List, create, or delete branches commit     Record changes to the repository merge      Join two or more development histories together rebase     Reapply commits on top of another base tip reset      Reset current HEAD to the specified state switch     Switch branches tag        Create, list, delete or verify a tag object signed with GPG  collaborate (see also: git help workflows) fetch      Download objects and refs from another repository pull       Fetch from and integrate with another repository or a local branch push       Update remote refs along with associated objects  'git help -a' and 'git help -g' list available subcommands and some concept guides. See 'git help <command>' or 'git help <concept>' to read about a specific subcommand or concept. See 'git help git' for an overview of the system. @ usage: git [-v | --version] [-h | --help] [-C <path>] [-c <name>=<value>] [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path] [-p | --paginate | -P | --no-pager] [--no-replace-objects] [--no-lazy-fetch] [--no-optional-locks] [--no-advice] [--bare] [--git-dir=<path>] [--work-tree=<path>] [--namespace=<name>] [--config-env=<name>=<envvar>] <command> [<args>]  These are common Git commands used in various situations:  start a working area (see also: git help tutorial) clone      Clone a repository into a new directory init       Create an empty Git repository or reinitialize an existing one  work on the current change (see also: git help everyday) add        Add file contents to the index mv         Move or rename a file, a directory, or a symlink restore    Restore working tree files rm         Remove files from the working tree and from the index  examine the history and state (see also: git help revisions) bisect     Use binary search to find the commit that introduced a bug diff       Show changes between commits, commit and working tree, etc grep       Print lines matching a pattern log        Show commit logs show       Show various types of objects status     Show the working tree status  grow, mark and tweak your common history backfill   Download missing objects in a partial clone branch     List, create, or delete branches commit     Record changes to the repository merge      Join two or more development histories together rebase     Reapply commits on top of another base tip reset      Reset current HEAD to the specified state switch     Switch branches tag        Create, list, delete or verify a tag object signed with GPG  collaborate (see also: git help workflows) fetch      Download objects and refs from another repository pull       Fetch from and integrate with another repository or a local branch push       Update remote refs along with associated objects  'git help -a' and 'git help -g' list available subcommands and some concept guides. See 'git help <command>' or 'git help <concept>' to read about a specific subcommand or concept. See 'git help git' for an overview of the system.
- Admin (masked): 

## Deploy flow
1) Edit locally in C:\bc\cloudflare\html
2) git add -A && git commit -m "msg" && git push origin main
3) Cloudflare auto-deploys (Functions from /functions)

## Verify
- GET /api/healthcheck → { ok: true }
- Custom domains Active, SSL Full
- No wrangler parse/BOM errors

## Guardrails (Rules v3.0)
- PowerShell-first. Full files. Exact - Keep structure and names. Production-first on main.
- Explain what it does / what to expect.
- New Chat Rule: Every new chat must read the current GitHub codebase and confirm understanding of the rules **before** writing any code. No work starts until the repo context is acknowledged in-chat.

## Rollback & Tags
- Tag stable: git tag v0.1-setup-clean && git push origin --tags
- Rollback: git revert <sha>  or deploy previous commit in Cloudflare

## Resuming a session
1) Load seed/state.json and seed/RESUME.md
2) Confirm HANDOFF.md timestamp and tasks
3) Run scripts/update-seed.ps1
4) Start with “Next 2 tasks”

## See also
- seed/AI_README.md — project overview
- seed/SOP_SEED.md — session protocol
- seed/RULES.md — governance and safety

## Next 2 tasks (do now)
1) /admin/dashboard/ shell + session guard
2) CSV import UI → POST /api/admin/brands/import (dry-run + commit)