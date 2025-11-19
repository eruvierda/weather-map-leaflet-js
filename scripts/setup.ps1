# Weather Map Setup Script for Windows (PowerShell)
# This script sets up the Weather Map application

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Weather Map Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
Write-Host "Checking Node.js version..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($nodeMajor -lt 18) {
        Write-Host "❌ Node.js version 18 or higher is required" -ForegroundColor Red
        Write-Host "   Current version: $nodeVersion" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check npm version
Write-Host "Checking npm version..." -ForegroundColor Yellow
try {
    $npmVersion = npm -v
    $npmMajor = [int]($npmVersion -split '\.')[0]
    if ($npmMajor -lt 9) {
        Write-Host "❌ npm version 9 or higher is required" -ForegroundColor Red
        Write-Host "   Current version: $npmVersion" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ npm is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check MongoDB
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
$mongoInstalled = $false
try {
    $null = Get-Command mongosh -ErrorAction Stop
    Write-Host "✅ MongoDB client (mongosh) is installed" -ForegroundColor Green
    $mongoInstalled = $true
}
catch {
    try {
        $null = Get-Command mongo -ErrorAction Stop
        Write-Host "✅ MongoDB client (mongo) is installed" -ForegroundColor Green
        $mongoInstalled = $true
    }
    catch {
        Write-Host "⚠️  MongoDB client not found. Make sure MongoDB is installed and running." -ForegroundColor Yellow
    }
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Create .env file if it doesn't exist
Write-Host ""
if (-not (Test-Path .env)) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ .env file created" -ForegroundColor Green
    Write-Host "⚠️  Please edit .env file with your configuration" -ForegroundColor Yellow
}
else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Create logs directory
Write-Host ""
Write-Host "Creating logs directory..." -ForegroundColor Yellow
if (-not (Test-Path logs)) {
    New-Item -ItemType Directory -Path logs | Out-Null
}
Write-Host "✅ Logs directory created" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit .env file with your configuration"
Write-Host "2. Start the server: npm start"
Write-Host "3. Collect weather data: npm run collect:all"
Write-Host ""
Write-Host "For more information, see README.md" -ForegroundColor Cyan
Write-Host ""
