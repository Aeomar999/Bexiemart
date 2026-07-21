#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Seeding admin user (idempotent)..."
node dist/scripts/seed-admin.js || echo "Admin seed skipped (already exists or failed)"

echo "Starting server..."
exec node dist/main.js
