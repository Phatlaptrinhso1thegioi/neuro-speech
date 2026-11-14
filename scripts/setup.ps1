# scripts/setup.ps1
# Windows PowerShell setup script for NEURO-SPEECH
# Sets up Python virtual environment, installs dependencies, seeds database, and installs frontend npm packages.

$ErrorActionPreference = "Stop"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "       NEURO-SPEECH Setup Script (Windows)       " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location -Path $ProjectRoot

# 1. Check Python installation
Write-Host "`n[1/5] Checking Python..." -ForegroundColor Yellow
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "Python 3 is not found in PATH. Please install Python 3.10+ from python.org."
}

# 2. Virtual Environment
Write-Host "`n[2/5] Setting up virtual environment..." -ForegroundColor Yellow
if (-not (Test-Path "$ProjectRoot\venv")) {
    Write-Host "Creating virtual environment at $ProjectRoot\venv..."
    python -m venv venv
}

$VenvPython = "$ProjectRoot\venv\Scripts\python.exe"
$VenvPip = "$ProjectRoot\venv\Scripts\pip.exe"

if (-not (Test-Path $VenvPython)) {
    Write-Error "Virtual environment python executable not found at $VenvPython."
}

# 3. Install Python Dependencies
Write-Host "`n[3/5] Installing pinned Python dependencies..." -ForegroundColor Yellow
& $VenvPip install --upgrade pip
if (Test-Path "$ProjectRoot\requirements.txt") {
    & $VenvPip install -r "$ProjectRoot\requirements.txt"
} else {
    Write-Warning "requirements.txt not found. Installing base packages..."
    & $VenvPip install fastapi uvicorn scikit-learn mne moabb pandas numpy scipy
}

# 4. Seed Database
Write-Host "`n[4/5] Initializing SQLite database and seeding pre-seeded accounts..." -ForegroundColor Yellow
& $VenvPython "$ProjectRoot\scripts\seed_db.py"

# 5. Frontend npm setup
Write-Host "`n[5/5] Checking frontend dependencies (Node.js)..." -ForegroundColor Yellow
if (Get-Command npm -ErrorAction SilentlyContinue) {
    Set-Location -Path "$ProjectRoot\apps\web"
    if (Test-Path "package.json") {
        Write-Host "Installing npm packages in apps\web..."
        npm install
    }
    Set-Location -Path $ProjectRoot
} else {
    Write-Warning "npm not found in PATH. Frontend web dependencies were not installed automatically."
}

# System health check
Write-Host "`nRunning system health check..." -ForegroundColor Cyan
& $VenvPython "$ProjectRoot\scripts\health_check.py"

Write-Host "`n=== Setup complete! ===" -ForegroundColor Green
Write-Host "To run the application, run: .\scripts\run.ps1" -ForegroundColor Green
