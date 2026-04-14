$ErrorActionPreference = "Stop"

Write-Host "Emory local setup (Windows)" -ForegroundColor Cyan
Write-Host "This script installs dependencies and starts backend/frontend in separate terminals." -ForegroundColor Gray

$repoUrl = "https://github.com/keerthana9944/Emory.git"
$projectRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "frontend"

if (!(Test-Path $backendPath) -or !(Test-Path $frontendPath)) {
  $projectRoot = Join-Path (Get-Location) "Emory"
  if (!(Test-Path $projectRoot)) {
    Write-Host "Project not found nearby. Cloning repository..." -ForegroundColor Yellow
    git clone $repoUrl $projectRoot
  }

  $backendPath = Join-Path $projectRoot "backend"
  $frontendPath = Join-Path $projectRoot "frontend"

  if (!(Test-Path $backendPath) -or !(Test-Path $frontendPath)) {
    Write-Host "Could not locate backend/frontend after clone." -ForegroundColor Red
    exit 1
  }
}

Write-Host "Checking Ollama..." -ForegroundColor Yellow
try {
  ollama --version | Out-Null
} catch {
  Write-Host "Ollama is not installed or not in PATH." -ForegroundColor Red
  Write-Host "Install from: https://ollama.com/download/windows" -ForegroundColor Yellow
  exit 1
}

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Push-Location $backendPath
npm.cmd install
Pop-Location

Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Push-Location $frontendPath
npm.cmd install
Pop-Location

Write-Host "Starting backend terminal..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm.cmd start"

Write-Host "Starting frontend terminal..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm.cmd run dev"

Write-Host "Done. Open http://localhost:5173" -ForegroundColor Cyan
