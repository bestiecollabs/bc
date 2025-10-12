SOP — Seed Kit
Use:
- AI_README.md: top block is current state.
- HANDOFF.md: prepend one block per session with verified/blocked.
- SESSIONS.md: append one-line session ledger.
- RULES.md: update only when governance changes.
- SOP_SEED.md: this file; the how-to.

Real DB apply:
- Run a dedicated script: wrangler d1 migrations apply DB
- Only after PR checks pass and change is approved.
