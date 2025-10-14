# Return the latest preview URL for project 'bc'
param()
\ = wrangler pages deployment list --project-name bc | Out-String
\ = [regex]::Match(\, 'https://[a-f0-9]+\.bc-ezy\.pages\.dev')
if(-not \.Success){ throw 'No preview URL found for bc.' }
\.Value
