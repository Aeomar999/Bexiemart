# Stage 1: Build stage
FROM node:22-alpine AS builder

# Install OpenSSL and build utilities needed for Prisma engine and native dependencies
RUN apk add --no-cache openssl python3 make g++

WORKDIR /app

# Copy dependency definition files
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependencies using clean install with legacy peer deps for NestJS compatibility
RUN npm ci --legacy-peer-deps

# Generate Prisma Client
RUN npx prisma generate

# Copy application source code and NestJS config files
COPY tsconfig*.json nest-cli.json ./
COPY src ./src/

# Build NestJS application bundle to dist/
RUN npm run build

# Prune devDependencies to keep the production layer clean and compact
RUN npm prune --production --legacy-peer-deps

# Stage 2: Production runner
FROM node:22-alpine AS runner

# Install OpenSSL required by Prisma query engine at runtime
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create dedicated non-root user/group for security compliance
RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

# Create required directories for uploads and static assets and grant ownership
RUN mkdir -p /app/uploads /app/public /app/dist && \
    chown -R nestjs:nestjs /app

# Copy production node_modules (including Prisma client), schema, and dist/ from builder stage
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nestjs /app/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/package.json ./package.json

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]
