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

Write-Host "Checking backend prerequisites..." -ForegroundColor Yellow
Write-Host "This project now uses an OpenAI-compatible hosted API for the backend." -ForegroundColor Cyan
Write-Host "Make sure your backend env has AI_PROVIDER, AI_API_KEY, AI_BASE_URL, and MODEL set." -ForegroundColor Cyan

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
