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

# 2. Ensure root .env exists and contains strong infrastructure secrets.
#    We no longer blindly copy apps/server/.env (its shape lacks the compose
#    infra vars, which used to trigger known insecure fallbacks).
REQUIRED_SECRETS=(POSTGRES_PASSWORD REDIS_PASSWORD BETTER_AUTH_SECRET JWT_SECRET)

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "📄 Root .env not found — creating it from .env.example..."
        cp .env.example .env
    else
        echo "❌ Error: .env is required and no .env.example template was found."
        exit 1
    fi
fi

get_env_var() {
    grep -E "^$1=" .env | tail -n1 | cut -d= -f2-
}

set_env_var() {
    # Replace or append KEY=value portably (no GNU-only sed -i flags).
    grep -v "^$1=" .env > .env.tmp || true
    mv .env.tmp .env
    printf '%s=%s\n' "$1" "$2" >> .env
}

for KEY in "${REQUIRED_SECRETS[@]}"; do
    if [ -z "$(get_env_var "$KEY")" ]; then
        echo "🔑 Generating strong random value for $KEY..."
        set_env_var "$KEY" "$(openssl rand -hex 32)"
    fi
done

# 3. Loud warnings for unset integration credentials (they fail closed).
for KEY in PAYSTACK_SECRET_KEY CLOUDINARY_CLOUD_NAME RESEND_API_KEY SENTRY_DSN; do
    if [ -z "$(get_env_var "$KEY")" ]; then
        echo "⚠️  $KEY is not set — the related feature is disabled or fails closed."
    fi
done

echo "📦 Step 1: Building production containers..."
$DOCKER_COMPOSE_CMD build --pull

echo "🗄️  Step 2: Starting database and cache layers..."
$DOCKER_COMPOSE_CMD up -d postgres redis

echo "⏳ Waiting for PostgreSQL to be healthy..."
if ! timeout 60 bash -c 'until [ "$(docker inspect --format="{{.State.Health.Status}}" bexiemart-postgres)" = "healthy" ]; do sleep 2; done'; then
    echo "❌ Error: PostgreSQL did not become healthy within 60s. Check: docker compose logs postgres"
    exit 1
fi
echo "✅ PostgreSQL is healthy."

echo "🔄 Step 3: Running database migrations..."
$DOCKER_COMPOSE_CMD run --rm --no-deps server npx prisma migrate deploy

echo "🚀 Step 4: Starting backend server, admin panel, and nginx proxy..."
$DOCKER_COMPOSE_CMD up -d --remove-orphans

echo "⏳ Step 5: Verifying application health..."
HEALTHY=0
for _ in $(seq 1 15); do
    if curl -fsSL http://localhost/api/v1/health > /dev/null 2>&1; then
        HEALTHY=1
        break
    fi
    sleep 2
done

if [ "$HEALTHY" -eq 1 ]; then
    echo "✅ BexieMart deployment completed successfully!"
    echo "   API Health: http://localhost/api/v1/health"
    echo "   Admin Panel: http://localhost"
else
    echo "❌ Deployment FAILED the health check after 30 seconds."
    echo "   Inspect logs: $DOCKER_COMPOSE_CMD logs server admin nginx"
    exit 1
fi