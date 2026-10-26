# EmDash 試験環境をCloudflareに載せる(PowerShellで実行)
$ErrorActionPreference = "Stop"
$v = [version](node -v).TrimStart("v")
if ($v -lt [version]"22.23.4") { Write-Host "Node.js 22.23.4以上が必要です(今: $v)。https://nodejs.org から入れ直してください"; exit 1 }
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { npm i -g pnpm }
pnpm install
npx wrangler login
pnpm deploy
Write-Host "`n上に出た https://....workers.dev のURLを控えて、次を実行してください:"
Write-Host "node tools/load.mjs https://(そのURL)"
