# Bexiemart — Audit Remediation Checklist

## CRITICAL (5 items) — Blocking production

- [ ] **C1 — Enable CORS** (`main.ts`)
  Add `app.enableCors({ origin: whitelist, credentials: true })` before any other middleware.

- [ ] **C2 — Secure Paystack webhook** (`payments.controller.ts`)
  Verify `x-paystack-signature` HMAC SHA-512 against raw body using the secret key. Reject invalid signatures with 403.

- [ ] **C3 — Add rate-limiting** (global)
  Install `@nestjs/throttler`, apply global guard (e.g., 120 req/min), plus stricter limits on auth (5 req/min) and sensitive endpoints.

- [ ] **C4 — Add helmet** (`main.ts`)
  `app.use(helmet())` for XSS, clickjacking, MIME-sniffing protection.

- [ ] **C5 — Enforce HTTPS** (proxy-level or `main.ts`)
  Add HTTPS redirect guard. Set `app.set('trust proxy', 1)` if behind a reverse proxy.

---

## HIGH (8 items) — Pre-launch blockers

- [ ] **H1 — JWT refresh tokens & revocation**
  Implement refresh-token rotation, store refresh token in httpOnly cookie, add Redis deny-list for revoked tokens.

- [ ] **H2 — Multi-role support**
  Replace single `role` enum with many-to-many `UserRole`. Create `@Roles()` decorator + guard. Ensure vendor-signup doesn't overwrite existing roles.

- [ ] **H3 — Fix auth guard token passing** (`auth.guard.ts`)
  Either use proper cookies (`res.cookie(...)`) or call Better Auth's token-validation API directly instead of Bearer→cookie header trick.

- [ ] **H4 — Wrap financial mutations in transactions**
  Use `prisma.$transaction()` with serializable isolation for wallet credit/debit, escrow release, order fulfillment. Add optimistic concurrency (version field) for stock.

- [ ] **H5 — Input validation on all DTOs**
  Add `class-validator` decorators to every DTO. Apply global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`. Mask stack traces in production.

- [ ] **H6 — Upload file validation** (`upload.controller.ts`)
  Add MIME-type whitelist, max file size (5MB images / 50MB video), optional ClamAV scan before generating Cloudinary signature.

- [ ] **H7 — Secure web token storage**
  Replace `localStorage` fallback with httpOnly session cookies on web. On native, keep SecureStore but add biometric auth option.

- [ ] **H8 — Audit logging**
  Add structured logging (Winston/Pino) for all sensitive operations: role changes, withdrawals, dispute outcomes, admin actions. Log actor ID, action, resource, old/new state, IP, timestamp.

---

## MEDIUM (9 items) — Strongly recommended

- [ ] **M1 — Health endpoint** (`GET /api/health`)
  Return `{ status, uptime, db }` for load-balancer probes.

- [ ] **M2 — API versioning**
  Prefix routes with `/api/v1/` and/or support `Accept: application/vnd.bexiemart.v1+json`.

- [ ] **M3 — Email verification enforcement**
  Implement verification email on signup. Gate vendoring, withdrawals, and admin actions behind `emailVerified === true`.

- [ ] **M4 — Migrate wallet PIN from bcryptjs → argon2**
  Update `wallet.service.ts` and mobile PIN validation to use argon2id. Keep existing brute-force freeze logic.

- [ ] **M5 — Validate dispatcher coordinates** (`dispatcher.service.ts`)
  Add bounds check (±500m from campus center). Reject implausible lat/lng values.

- [ ] **M6 — Prisma connection pool config** (`prisma.service.ts`)
  Set pool size, statement timeout, connection retry, and slow-query logging in PrismaClient constructor.

- [ ] **M7 — Environment-specific API URL** (`mobile/.env`)
  Move `API_URL` to EAS Build environment config per release channel (dev / staging / prod).

- [ ] **M8 — Harden chat gateway auth** (`chat.gateway.ts`)
  Explicitly reject unauthenticated WebSocket connections. Apply rate-limiting to all events, not just messages.

- [ ] **M9 — Add error monitoring**
  Integrate Sentry (`@sentry/node` + `@sentry/react-native`) with source maps for both server and mobile.

---

## LOW (10 items) — Polish & backlog

- [ ] **L1 — Feature flags**
  Add LaunchDarkly / PostHog for gradual rollouts and A/B testing.

- [ ] **L2 — Docker & deployment config**
  Add `Dockerfile`, `docker-compose.yml`, `nginx.conf`, and deployment scripts.

- [ ] **L3 — Unit & e2e tests**
  Add Jest/Vitest config for server. Write tests for guards, services, controllers, and critical paths (auth, payments, checkout).

- [ ] **L4 — Flash-sales scheduler**
  Add Bull/RabbitMQ queue or cron job to activate/deactivate flash sales instead of query-time checks.

- [ ] **L5 — Accessibility labels** (mobile)
  Add `accessibilityLabel`, `accessibilityRole`, and `aria-*` to all interactive elements.

- [ ] **L6 — OTA updates**
  Integrate EAS Update for over-the-air mobile patches without app store resubmission.

- [ ] **L7 — Admin config CRUD**
  Implement `GET /admin/config`, platform analytics dashboard, and user-impersonation safeguards.

- [ ] **L8 — Dispute resolution workflow**
  Build admin UI/API for reviewing disputes, communicating with buyer/vendor, and tracking resolution SLAs.

- [ ] **L9 — Prisma indexes**
  Add indexes on `(userId, status)` in Order, `(productId, userId)` in Review, `(vendorId)` in Product, and other common query patterns.

- [ ] **L10 — Consolidate fonts** (mobile)
  Reduce from 4 font families to 2 (heading + body) for visual consistency and smaller bundle size.

---

## Progress tracker

```
CRITICAL:  ░░░░░░░░░░░░░░░░░░░░  0/5
HIGH:      ░░░░░░░░░░░░░░░░░░░░  0/8
MEDIUM:    ░░░░░░░░░░░░░░░░░░░░  0/9
LOW:       ░░░░░░░░░░░░░░░░░░░░  0/10
```

**Legend:** `[ ]` = pending, `[x]` = done, `[-]` = skipped/won't fix
