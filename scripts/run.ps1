# scripts/run.ps1
# Windows PowerShell execution script for NEURO-SPEECH
# Launches backend FastAPI server and optionally frontend Vite development server.

param (
    [string]$Mode = "all" # Options: all, api, web
)

$ErrorActionPreference = "Stop"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "       NEURO-SPEECH Execution Script (Windows)    " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location -Path $ProjectRoot

$VenvPython = "$ProjectRoot\venv\Scripts\python.exe"

if (-not (Test-Path $VenvPython)) {
    Write-Error "Virtual environment not found at $VenvPython. Run .\scripts\setup.ps1 first."
}

if ($Mode -eq "api") {
    Write-Host "Starting NEURO-SPEECH FastAPI backend on http://127.0.0.1:8000..." -ForegroundColor Green
    & $VenvPython -m uvicorn apps.api.app.main:app --host 127.0.0.1 --port 8000 --reload
} elseif ($Mode -eq "web") {
    Write-Host "Starting NEURO-SPEECH Web UI on http://127.0.0.1:3000..." -ForegroundColor Green
    Set-Location -Path "$ProjectRoot\apps\web"
    npm run dev
} else {
    Write-Host "Starting both Backend (127.0.0.1:8000) and Web Frontend (127.0.0.1:3000)..." -ForegroundColor Green
    
    # Start API in background job
    $ApiJob = Start-Job -ScriptBlock {
        param($root, $py)
        Set-Location -Path $root
        & $py -m uvicorn apps.api.app.main:app --host 127.0.0.1 --port 8000
    } -ArgumentList $ProjectRoot, $VenvPython

    Write-Host "Backend API process started (Job ID: $($ApiJob.Id))." -ForegroundColor Cyan
    Write-Host "Starting Web Frontend..." -ForegroundColor Cyan

    try {
        Set-Location -Path "$ProjectRoot\apps\web"
        npm run dev
    } finally {
        Write-Host "Stopping Backend API process..." -ForegroundColor Yellow
        Stop-Job -Job $ApiJob
        Remove-Job -Job $ApiJob
    }
}
