# Inicia o servidor (Fastify) e o cliente (Vite) em janelas separadas.
# Uso: na pasta webapp, execute: .\start_app_dev.ps1
# Pré-requisito: `npm install` em webapp\server e webapp\client.

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
if (-not $root) {
  $root = Split-Path -Parent $MyInvocation.MyCommand.Path
}

$serverDir = Join-Path $root 'server'
$clientDir = Join-Path $root 'client'

foreach ($d in @($serverDir, $clientDir)) {
  if (-not (Test-Path (Join-Path $d 'package.json'))) {
    Write-Error "Pasta esperada não encontrada ou sem package.json: $d"
  }
}

Write-Host 'Abrindo terminais: API (server) e Vite (client)...' -ForegroundColor Cyan

Start-Process powershell -WorkingDirectory $serverDir -ArgumentList @(
  '-NoExit',
  '-NoLogo',
  '-Command',
  "Write-Host 'ot-account-api (npm run dev)' -ForegroundColor Green; npm run dev"
)

Start-Process powershell -WorkingDirectory $clientDir -ArgumentList @(
  '-NoExit',
  '-NoLogo',
  '-Command',
  "Write-Host 'client Vite (npm run dev)' -ForegroundColor Green; npm run dev"
)

Write-Host 'Pronto. Feche as janelas ou use Ctrl+C em cada uma para parar.' -ForegroundColor Gray
