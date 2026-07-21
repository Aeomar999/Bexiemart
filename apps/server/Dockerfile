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
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production

COPY apps/server/package*.json ./
RUN npm ci --omit=dev

# Copy compiled output and generated Prisma artifacts from build stage
COPY --from=build /app/apps/server/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/apps/server/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/apps/server/node_modules/prisma ./node_modules/prisma
COPY --from=build /app/apps/server/dist ./dist
COPY --from=build /app/apps/server/prisma ./prisma

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && (node dist/scripts/seed-admin.js || true) && node dist/main.js"]
