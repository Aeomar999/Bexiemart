# Bexiemart Deployment Guide

This document details the deployment architecture, promotion pipeline, rollback procedures, and database migration rules for the Bexiemart ecosystem (Backend API, Admin Dashboard, and Mobile App).

---

## 1. Core Principles

### Build Once, Promote Many (D2)
- Container images and build bundles are created **exactly once per git commit SHA** during CI/CD.
- Staging and production deploy the **identical image artifact digest** (`ghcr.io/<org>/bexiemart-backend:<sha>`).
- We never rebuild from source for production; we promote the artifact that already succeeded in staging and passed all smoke tests.

### Health-Gated Zero Downtime (SEC-112, D6)
- Container deployments use Docker Compose project namespaces (`bexiemart-staging`, `bexiemart-production`).
- The VPS deploy controller (`deploy/bin/bexiemart-deploy`) polls `/api/v1/health` for up to 60 seconds after launching containers.
- If the container fails to report healthy status with matching `release` SHA and `environment`, `bexiemart-deploy` immediately reverts to the previous recorded release (`previous_release`) and exits with code 1.

### Expand/Contract Database Evolution
- **Never perform destructive database schema changes in a single release.**
- Old API versions and older mobile app builds in user devices run concurrently against the database alongside new versions.
- Schema changes must strictly follow the **Expand/Contract** pattern described in Section 4.

---

## 2. Release & Promotion Pipeline

### Branch flow (staging-first)

```text
feature/* ──PR──▶ staging ──verify on staging hosts──▶ PR ──▶ main ──▶ promo below
```

- `feature/*` branches merge into `staging` via PR (CI must be green).
- Verify on `staging-admin.bexiemart.com` (`API_PROXY_TARGET=https://staging-api.bexiemart.com/api/v1`),
  `staging-api.bexiemart.com`, and the EAS `staging` channel.
- Promote `staging` into `main` via PR (CI must be green). Merges to `main`
  auto-deploy staging again (build-once `:sha`) and wait on the GitHub
  `Production` environment approval before production.
- Both `staging` and `main` are GitHub-protected: PR-only, CI-green,
  no force-pushes, no deletions. Never push straight to `main`.

```text
┌────────────────┐     ┌──────────────────────────────────────────────────────────────┐
│  PR to `main`  │ ──▶ │ CI: Backend Tests · Admin Tests & E2E · App Tests · Hygiene │
└────────────────┘     └──────────────────────────────────────────────────────────────┘
                                       │
                                (Merge to main)
                                       ▼
                        ┌──────────────────────────────┐
                        │   Build Docker Image :<sha>  │
                        │   Push to GitHub GHCR        │
                        └──────────────────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │      Deploy to Staging       │
                        │   SSH: bexiemart-deploy      │
                        └──────────────────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │     Automated Smoke Test     │
                        │   node scripts/smoke.mjs     │
                        └──────────────────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │  GitHub Environment Approval │
                        │    (Production Reviewers)    │
                        └──────────────────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │     Deploy to Production     │
                        │  SSH: bexiemart-deploy       │
                        └──────────────────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │     Production Smoke Test    │
                        │   node scripts/smoke.mjs     │
                        └──────────────────────────────┘
```

---

## 3. Deployment Controller (`deploy/bin/bexiemart-deploy`)

The VPS deploy controller is triggered remotely via SSH forced command (`deploy/bin/bexiemart-deploy-gate`).

### Operations:
```bash
# Deploy a specific commit SHA to an environment
bexiemart-deploy deploy staging <sha>
bexiemart-deploy deploy production <sha>

# Rollback to the previously active commit SHA
bexiemart-deploy rollback staging
bexiemart-deploy rollback production

# Check current and previous releases and running containers
bexiemart-deploy status staging
bexiemart-deploy status production
```

### Execution Sequence on Deploy:
1. Validates presence of target environment configuration (`/opt/bexiemart/<env>/api.env`).
2. Pulls target Docker image from GHCR: `${API_IMAGE}:${TARGET_SHA}`.
3. Executes pending database migrations via one-off container:
   ```bash
   docker compose -f deploy/compose.yml --project-name bexiemart-<env> run --rm --no-deps api node scripts/migrate.js
   ```
   *If migrations fail, the deployment halts immediately before touching running containers.*
4. Starts new containers with zero-downtime rolling replacement:
   ```bash
   docker compose -f deploy/compose.yml --project-name bexiemart-<env> up -d --remove-orphans
   ```
5. Polls `/api/v1/health` every 3 seconds for 60 seconds verifying:
   - HTTP 200 response
   - `body.status` in `['ok', 'degraded']`
   - `body.release === TARGET_SHA`
   - `body.environment === TARGET_ENV`
6. On success: records `previous_release` and `current_release` in `/opt/bexiemart/<env>/`.
7. On failure: dumps container logs and automatically re-deploys `previous_release`.

---

## 4. Database Migrations & The Expand/Contract Pattern

Database migrations live in `apps/server/migrations/` and are managed by Prisma.

### Why Expand/Contract is Mandatory
In mobile ecosystems and distributed web services:
- Mobile app updates (EAS Update or App Store) are installed asynchronously by users over days or weeks.
- The new API version, old API version, and multiple mobile client versions run side-by-side against PostgreSQL.
- Dropping a column, renaming a column, or adding a required column with no default immediately crashes active clients.

### Three-Phase Migration Lifecycle:

#### Phase 1: Expand
- Add new tables, optional columns, or indexes non-destructively.
- Any new column must be optional in validation schemas (or have a default value).
- Example: Adding `email_normalized` while keeping `email` functional.

#### Phase 2: Transition (Dual-Write / Dual-Read)
- Backend code writes to both old and new columns, but reads preferentially from new columns with fallbacks.
- Background backfill scripts populate legacy records with the new column structure.
- Both old mobile versions and new mobile versions function seamlessly.

#### Phase 3: Contract (Prune)
- Executed only after telemetry confirms all mobile clients and API instances are upgraded past the minimum supported version.
- Remove deprecated columns and legacy read paths.
- Drop obsolete indexes.

### Writing a Migration
Each migration is a Prisma migration file under `apps/server/prisma/migrations/`:

```prisma
// Example: Add user preferences column
alter table users add column preferences jsonb default '{}'::jsonb;
```

### Tracking:
Applied migrations are recorded in the `_prisma_migrations` table with execution timestamp and checksum. Re-running `npx prisma migrate deploy` is completely idempotent and skips previously executed files.

---

## 5. Automated Smoke Testing (`scripts/smoke.mjs`)

Following every container deployment, the CI/CD pipeline runs `scripts/smoke.mjs`:
```bash
node scripts/smoke.mjs <baseUrl> <expectedSha> [expectedEnv]
```

### Verified Checks:
1. **Liveness & Integrity:** `GET <baseUrl>/api/v1/health` returns HTTP 200 with status `ok` or `degraded`, database connected, environment matching target, and release matching commit SHA.
2. **Public Data Endpoint:** `GET <baseUrl>/api/v1/products?limit=1` returns HTTP 200 confirming routing, database query layer, and serialization operate for unauthenticated traffic.
3. **CORS Preflight:** `OPTIONS <baseUrl>/api/v1/auth/me` with `Origin` and `Access-Control-Request-Method: GET` returns 200/204 with `Access-Control-Allow-Origin` matching the allowed admin origin.

---

## 6. Rollback Procedures (< 5 Minutes)

When an issue occurs in production, three rollback options are available in order of preference:

### Method 1: GitHub Actions Workflow Dispatch (Recommended)
1. Go to **Actions** → **CD Backend**.
2. Click **Run workflow**.
3. In **Commit SHA to deploy or rollback to**, enter the previous known-good commit SHA (e.g. `ba9c64e`).
4. In **Target environment**, select `production`.
5. Click **Run workflow**.
6. The pipeline pulls the existing immutable image `:<sha>` and deploys it in under 2 minutes.

### Method 2: Emergency VPS CLI Rollback
If GitHub Actions is unavailable:
```bash
ssh deploy@<vps-ip> "rollback production"
```
The controller immediately pulls the release stored in `/opt/bexiemart/production/previous_release`, deploys containers, and validates health.

### Method 3: Mobile OTA Rollback
If a regression affects the mobile application:
```bash
cd apps/mobile
eas update:rollback --channel production
```
Or publish an update from the previous known-good commit.

---

## 7. Environment Topology & Hostnames

| Environment | API Hostname | Admin Hostname | Mobile API URL |
|---|---|---|---|
| **Production** | `https://api.bexiemart.com` | `https://admin.bexiemart.com` | `https://api.bexiemart.com/api/v1` |
| **Staging** | `https://staging-api.bexiemart.com` | `https://staging-admin.bexiemart.com` | `https://staging-api.bexiemart.com/api/v1` |
| **Development** | `https://dev-api.bexiemart.com` | `http://localhost:3001` | `https://dev-api.bexiemart.com/api/v1` |

*Note: All staging and development hostnames use single-level subdomains (`staging-api.*`, not `staging.api.*`) to remain within Cloudflare Universal SSL wildcard certificate boundaries (SEC-111).*
