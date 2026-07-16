# BexieMart Production Deployment Script (PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 BexieMart Production Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Verify docker availability
if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: docker is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# 2. Check .env
if (-not (Test-Path ".env")) {
    if (Test-Path "apps/server/.env") {
        Write-Host "⚠️  Root .env not found, copying from apps/server/.env..." -ForegroundColor Yellow
        Copy-Item "apps/server/.env" ".env"
    } else {
        Write-Host "❌ Error: .env file is required for deployment. Please create .env with required secrets." -ForegroundColor Red
        exit 1
    }
}

Write-Host "📦 Step 1: Building production containers..." -ForegroundColor Green
docker compose build --pull

Write-Host "🗄️  Step 2: Starting database and cache layers..." -ForegroundColor Green
docker compose up -d postgres redis

Write-Host "⏳ Waiting for PostgreSQL to be healthy..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
do {
    Start-Sleep -Seconds 2
    $status = docker inspect --format="{{.State.Health.Status}}" bexiemart-postgres 2>$null
    $attempt++
} until ($status -eq "healthy" -or $attempt -ge $maxAttempts)

if ($status -ne "healthy") {
    Write-Host "⚠️  PostgreSQL is not reporting healthy yet, proceeding with caution..." -ForegroundColor Yellow
} else {
    Write-Host "✅ PostgreSQL is healthy!" -ForegroundColor Green
}

Write-Host "🔄 Step 3: Running database migrations..." -ForegroundColor Green
docker compose run --rm --no-deps -e DATABASE_URL server npx prisma migrate deploy

Write-Host "🚀 Step 4: Starting backend server, admin panel, and nginx proxy..." -ForegroundColor Green
docker compose up -d --remove-orphans

Write-Host "⏳ Step 5: Verifying application health..." -ForegroundColor Green
Start-Sleep -Seconds 10

try {
    $response = Invoke-WebRequest -Uri "http://localhost/api/v1/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ BexieMart deployment completed successfully!" -ForegroundColor Green
        Write-Host "   API Health: http://localhost/api/v1/health"
        Write-Host "   Admin Panel: http://localhost"
    }
} catch {
    Write-Host "⚠️  Warning: Health check endpoint did not respond within 10 seconds. Check logs with: docker compose logs server" -ForegroundColor Yellow
}
