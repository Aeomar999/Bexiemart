# BexieMart Production Deployment Script (PowerShell)
# NOTE: ASCII-only on purpose — Windows PowerShell 5.1 reads BOM-less files as
# ANSI, which mangles non-ASCII characters and can corrupt parsing.
$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "BexieMart Production Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Verify docker availability
if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] docker is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# 2. Ensure root .env exists and contains strong infrastructure secrets.
#    We no longer blindly copy apps/server/.env (its shape lacks the compose
#    infra vars, which used to trigger known insecure fallbacks).
$requiredSecrets = @("POSTGRES_PASSWORD", "REDIS_PASSWORD", "BETTER_AUTH_SECRET", "JWT_SECRET")

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "Root .env not found - creating it from .env.example..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
    } else {
        Write-Host "[ERROR] .env is required and no .env.example template was found." -ForegroundColor Red
        exit 1
    }
}

function Get-EnvVar([string]$Key) {
    $line = Select-String -Path ".env" -Pattern ("^" + $Key + "=") | Select-Object -Last 1
    if ($line) { return ($line.Line -replace ("^" + $Key + "="), "") }
    return ""
}

function Set-EnvVar([string]$Key, [string]$Value) {
    $lines = Get-Content ".env" | Where-Object { $_ -notmatch ("^" + $Key + "=") }
    Set-Content -Path ".env" -Value $lines
    Add-Content -Path ".env" -Value ("$Key=$Value")
}

function New-RandomHex {
    # 64 hex chars = 256 bits of entropy.
    -join ((1..64) | ForEach-Object { "{0:x}" -f (Get-Random -Maximum 16) })
}

foreach ($key in $requiredSecrets) {
    if ([string]::IsNullOrWhiteSpace((Get-EnvVar $key))) {
        Write-Host "Generating strong random value for $key..." -ForegroundColor Yellow
        Set-EnvVar $key (New-RandomHex)
    }
}

# 3. Loud warnings for unset integration credentials (they fail closed).
foreach ($key in @("PAYSTACK_SECRET_KEY", "CLOUDINARY_CLOUD_NAME", "RESEND_API_KEY", "SENTRY_DSN")) {
    if ([string]::IsNullOrWhiteSpace((Get-EnvVar $key))) {
        Write-Host "WARNING: $key is not set - the related feature is disabled or fails closed." -ForegroundColor Yellow
    }
}

Write-Host "Step 1: Building production containers..." -ForegroundColor Green
docker compose build --pull
if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] Build failed." -ForegroundColor Red; exit 1 }

Write-Host "Step 2: Starting database and cache layers..." -ForegroundColor Green
docker compose up -d postgres redis

Write-Host "Waiting for PostgreSQL to become healthy..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
do {
    Start-Sleep -Seconds 2
    $status = docker inspect --format="{{.State.Health.Status}}" bexiemart-postgres 2>$null
    $attempt++
} until ($status -eq "healthy" -or $attempt -ge $maxAttempts)

if ($status -ne "healthy") {
    Write-Host "[ERROR] PostgreSQL did not become healthy. Check: docker compose logs postgres" -ForegroundColor Red
    exit 1
}
Write-Host "PostgreSQL is healthy." -ForegroundColor Green

Write-Host "Step 3: Running database migrations..." -ForegroundColor Green
docker compose run --rm --no-deps server npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] Migrations failed." -ForegroundColor Red; exit 1 }

Write-Host "Step 4: Starting backend server, admin panel, and nginx proxy..." -ForegroundColor Green
docker compose up -d --remove-orphans

Write-Host "Step 5: Verifying application health..." -ForegroundColor Green
$healthy = $false
for ($i = 0; $i -lt 15; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/api/v1/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) { $healthy = $true; break }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if ($healthy) {
    Write-Host "BexieMart deployment completed successfully!" -ForegroundColor Green
    Write-Host "   API Health: http://localhost/api/v1/health" -ForegroundColor Green
    Write-Host "   Admin Panel: http://localhost" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Deployment FAILED the health check after ~30 seconds." -ForegroundColor Red
    Write-Host "   Inspect logs: docker compose logs server admin nginx" -ForegroundColor Red
    exit 1
}