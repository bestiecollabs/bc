# Admin API Routing and Access Notes (2025-10-31)

Paths
- /api/admin/* and /admin/* are protected by Cloudflare Access.
- Pages Functions serve /api/* and /db/* as defined in functions/_routes.json.

Functions routing
- Route file: functions/_routes.json
  {
    "version": 1,
    "include": [ "/api/*", "/db/*" ],
    "exclude": [ "/*.*", "/assets/*", "/static/*" ]
  }
- Users endpoint must be a folder route:
  functions/api/admin/users/index.ts
- Do not keep a sibling file functions/api/admin/users.ts. It collides with the folder.

Access configuration
- Application: bestiecollabs (Self-hosted)
- Domains included:
  - bestiecollabs.com/admin/*
  - bestiecollabs.com/api/admin/*
- Policy: Allow service token
  - Token name: bc_service_auth
  - Required headers for requests:
    - CF-Access-Client-Id
    - CF-Access-Client-Secret

Quick tests (PowerShell)
- Health:
  Invoke-WebRequest https://bestiecollabs.com/db/ping
- Access check:
  Invoke-WebRequest -Headers @{ 'CF-Access-Client-Id'=$env:CF_ACCESS_CLIENT_ID; 'CF-Access-Client-Secret'=$env:CF_ACCESS_CLIENT_SECRET } https://bestiecollabs.com/api/admin/ping
- Users placeholder should return JSON, not HTML:
  Invoke-WebRequest -Headers @{ 'CF-Access-Client-Id'=$env:CF_ACCESS_CLIENT_ID; 'CF-Access-Client-Secret'=$env:CF_ACCESS_CLIENT_SECRET } https://bestiecollabs.com/api/admin/users

Symptoms
- If you receive the Cloudflare Access HTML sign-in page, the service token is not allowed on that path. Fix the Access app policy and domains.
- If 404/HTML after Access is fixed, ensure users/index.ts exists and there is no users.ts at the same level.

