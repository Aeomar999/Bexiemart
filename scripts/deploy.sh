#!/usr/bin/env bash
set -eo pipefail

echo "=========================================="
echo "🚀 BexieMart Production Deployment Script"
echo "=========================================="

# 1. Verify required command line tools
if ! command -v docker &> /dev/null; then
    echo "❌ Error: docker is not installed or not in PATH."
    exit 1
fi

DOCKER_COMPOSE_CMD="docker compose"
if ! docker compose version &> /dev/null; then
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
    else
        echo "❌ Error: neither 'docker compose' nor 'docker-compose' could be found."
        exit 1
    fi
fi

# 2. Check environment file
if [ ! -f .env ]; then
    if [ -f apps/server/.env ]; then
        echo "⚠️  Root .env not found, copying from apps/server/.env..."
        cp apps/server/.env .env
    else
        echo "❌ Error: .env file is required for deployment. Please copy .env.example to .env and configure your secrets."
        exit 1
    fi
fi

echo "📦 Step 1: Building production containers..."
$DOCKER_COMPOSE_CMD build --pull

echo "🗄️  Step 2: Starting database and cache layers..."
$DOCKER_COMPOSE_CMD up -d postgres redis

echo "⏳ Waiting for PostgreSQL to be healthy..."
timeout 60 bash -c 'until docker inspect --format="{{.State.Health.Status}}" bexiemart-postgres | grep -q "healthy"; do sleep 2; echo -n "."; done'
echo ""

echo "🔄 Step 3: Running database migrations..."
$DOCKER_COMPOSE_CMD run --rm --no-deps -e DATABASE_URL server npx prisma migrate deploy

echo "🚀 Step 4: Starting backend server, admin panel, and nginx proxy..."
$DOCKER_COMPOSE_CMD up -d --remove-orphans

echo "⏳ Step 5: Verifying application health..."
sleep 10
if curl -fsSL http://localhost/api/v1/health > /dev/null; then
    echo "✅ BexieMart deployment completed successfully!"
    echo "   API Health: http://localhost/api/v1/health"
    echo "   Admin Panel: http://localhost"
else
    echo "⚠️  Warning: Health check endpoint did not respond cleanly within 10 seconds. Check logs with: docker compose logs server"
fi
