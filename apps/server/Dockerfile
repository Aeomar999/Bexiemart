# ---- stage 1: build ----
FROM node:20-slim AS build
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy root and target package files explicitly from root context
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies inside target app
WORKDIR /app/apps/server
RUN npm ci

# Copy source code and shared packages
WORKDIR /app
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

# Generate Prisma client and build NestJS
WORKDIR /app/apps/server
RUN npx prisma generate
RUN npm run build

# ---- stage 2: runtime ----
FROM node:20-slim AS runtime
WORKDIR /app

# Non-root runtime user (created before any COPY so ownership is correct).
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/* \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs bexiemart
ENV NODE_ENV=production

COPY apps/server/package*.json ./
RUN npm ci --omit=dev

# Copy compiled output and generated Prisma artifacts from build stage
COPY --from=build /app/apps/server/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/apps/server/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/apps/server/node_modules/prisma ./node_modules/prisma
COPY --from=build /app/apps/server/dist ./dist
COPY --from=build /app/apps/server/prisma ./prisma

# Writable uploads directory (compose mounts the server_uploads volume here)
RUN mkdir -p /app/uploads && chown -R bexiemart:nodejs /app

USER bexiemart

EXPOSE 3000

# Node-native healthcheck (no extra packages); node:20 ships global fetch.
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Boot-time migrations assume a single replica (Railway 1x / single-node compose).
# Seed failures are LOUD (stderr) but non-fatal: missing ADMIN_EMAIL/PASSWORD must
# not take the whole API down, yet must never disappear silently again.
CMD ["sh", "-c", "npx prisma migrate deploy && (node dist/scripts/seed-admin.js || echo 'WARNING: seed-admin failed or was skipped — check ADMIN_EMAIL/ADMIN_PASSWORD' >&2) && exec node dist/main.js"]
