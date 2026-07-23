# Sakon ABU - Complete Setup Script (Windows)
# This script installs all dependencies, sets up Ollama, pulls Gemma 4, and starts the application

$ErrorActionPreference = "Stop"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Sakon ABU - Setup Starting" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Check Node.js version
Write-Host ""
Write-Host "[1/7] Checking Node.js version..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

$nodeVersion = (node -v).TrimStart('v').Split('.')[0]
if ([int]$nodeVersion -lt 18) {
    Write-Host "ERROR: Node.js version must be 18 or higher. Current: $(node -v)" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js version: $(node -v) - OK" -ForegroundColor Green

# Install npm dependencies
Write-Host ""
Write-Host "[2/7] Installing npm dependencies..." -ForegroundColor Yellow
npm install
Write-Host "Dependencies installed successfully" -ForegroundColor Green

# Check if Ollama is installed
Write-Host ""
Write-Host "[3/7] Checking Ollama installation..." -ForegroundColor Yellow
if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    Write-Host "WARNING: Ollama is not installed." -ForegroundColor Red
    Write-Host "Please install Ollama from: https://ollama.ai/download" -ForegroundColor Yellow
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    exit 1
}
Write-Host "Ollama is installed - OK" -ForegroundColor Green

# Start Ollama service
Write-Host ""
Write-Host "[4/7] Starting Ollama service..." -ForegroundColor Yellow
Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
Start-Sleep -Seconds 3
Write-Host "Ollama service started" -ForegroundColor Green

# Check if Gemma 4 model is available
Write-Host ""
Write-Host "[5/7] Checking for Gemma 4 model..." -ForegroundColor Yellow
$models = ollama list
if ($models -notmatch "gemma4:e2b") {
    Write-Host "Gemma 4 E2B not found. Pulling model (this may take several minutes)..." -ForegroundColor Yellow
    ollama pull gemma4:e2b
    Write-Host "Gemma 4 E2B downloaded successfully" -ForegroundColor Green
} else {
    Write-Host "Gemma 4 E2B already available - OK" -ForegroundColor Green
}

# Initialize database
Write-Host ""
Write-Host "[6/7] Initializing database..." -ForegroundColor Yellow
if (-not (Test-Path "backend")) {
    New-Item -ItemType Directory -Path "backend" | Out-Null
}
Write-Host "Database directory created" -ForegroundColor Green

# Start the application
Write-Host ""
Write-Host "[7/7] Starting Sakon ABU..." -ForegroundColor Yellow
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend: http://localhost:3002" -ForegroundColor Green
Write-Host "Backend:  http://localhost:8080" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Yellow
Write-Host ""

npm start
