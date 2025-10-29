# Bestie Collabs

Static site with Cloudflare Pages Functions and a D1 database. Public so an AI assistant can read files and help automate work.

## Links

- Prod: https://bestiecollabs.com  
- API: https://api.bestiecollabs.com  
- Repo: https://github.com/bestiecollabs/bc

## Stack

- Cloudflare Pages + Functions (Wrangler config) :contentReference[oaicite:0]{index=0}  
- Cloudflare Workers Cron Triggers for scheduled jobs :contentReference[oaicite:1]{index=1}  
- Cloudflare D1 for data :contentReference[oaicite:2]{index=2}

## Quickstart

Prereqs: Node 18+, Git. Install Wrangler locally or run with npx. :contentReference[oaicite:3]{index=3}

```powershell
# install deps and run locally (Pages + Functions)
npm i
npx wrangler pages dev .
