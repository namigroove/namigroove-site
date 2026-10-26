# Deploy EmDash trial to Cloudflare (run in PowerShell)
$ErrorActionPreference = "Stop"
$v = [version](node -v).TrimStart("v")
if ($v -lt [version]"22.23.4") { Write-Host "Node.js 22.23.4 or newer is required (now: $v). Install the latest LTS from https://nodejs.org and reopen PowerShell."; exit 1 }
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { npm i -g pnpm }
pnpm install
npx wrangler login
pnpm deploy
Write-Host ""
Write-Host "Copy the https://....workers.dev URL above, then run:"
Write-Host "node tools/load.mjs https://(that URL)"
