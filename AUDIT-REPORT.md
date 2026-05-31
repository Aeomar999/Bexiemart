# Bexiemart — Production-Readiness Audit Report

**Date:** 2026-05-31  
**Scope:** Full monorepo — `apps/server` (NestJS + Prisma + Paystack + Cloudinary), `apps/mobile` (Expo + React Native + Zustand), `packages/shared`  
**Methodology:** Static code analysis. No live/staging environment was available.  
**Severity:** CRITICAL / HIGH / MEDIUM / LOW / INFO

---

## CRITICAL — Must fix before any production deployment

### C1. No CORS configuration

`app.enableCors()` is never called in `apps/server/src/main.ts`. By default, NestJS blocks all cross-origin requests — the mobile app (running on device/staging) cannot reach the API.

**Fix:** Configure CORS with explicit origin whitelist:
```ts
app.enableCors({
  origin: process.env.CORS_ORIGIN?.split(',') ?? ['bexiemart://', 'exp://'],
  credentials: true,
});
```

### C2. Paystack webhook has zero security

`POST /api/payments/webhook` at `payments.controller.ts:40` is completely unauthenticated. The `x-paystack-signature` header is fetched but **never verified** — an attacker can POST fake payment confirmations and trigger wallet credits, escrow releases, and order fulfillment.

**Fix:** Implement HMAC SHA-512 verification using the Paystack secret key:
```ts
const hash = crypto.createHmac('sha512', PAYSTACK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex');
if (hash !== req.headers['x-paystack-signature']) {
  throw new ForbiddenException('Invalid signature');
}
```

### C3. No rate-limiting on any endpoint

No `@nestjs/throttler` or `express-rate-limit` anywhere. Brute-force login, credential-stuffing, enumeration, and DoS attacks are trivially exploitable.

**Fix:** Apply global rate-limit (e.g., 120 req/min) and stricter limits on auth endpoints (5 req/min on login).

### C4. No security headers (helmet)

No `helmet` middleware. The app is vulnerable to XSS, clickjacking, MIME-sniffing, and other browser-level attacks.

**Fix:**
```ts
import helmet from 'helmet';
app.use(helmet());
```

### C5. No HTTPS enforcement

No global pipe or middleware redirecting HTTP → HTTPS. In production, traffic may be served in plaintext.

**Fix:** Add an HTTPS redirect guard or enforce at the reverse-proxy level (nginx/Caddy). Also set `app.set('trust proxy', 1)` if behind a proxy.

---

## HIGH — Significant risk; prioritize before launch

### H1. No JWT refresh tokens or token revocation

Auth guard (`auth.guard.ts`) validates the access token stored in `SecureStore`/`localStorage` and passes it as a cookie to Better Auth. There is no refresh-token mechanism — when the token expires, the mobile user is force-logged out (401 interceptor in `client.ts:54`). No token revocation list exists — compromised tokens remain valid until expiry.

**Fix:** Implement refresh-token rotation, store the refresh token in an httpOnly cookie, and maintain a deny-list (Redis) for revoked tokens.

### H2. Role model is single-field — no multi-role support

`enum Role` (customer | vendor | admin | dispatcher) is a single string on the User model. A user cannot be both a customer and a vendor — a common marketplace requirement. The dispatcher role is created by mutating the user's `role` field in the vendor-signup flow (`vendor.service.ts` creates a dispatcher by setting `role: 'dispatcher'` on the same user record), overwriting any existing role.

**Fix:** Refactor to a many-to-many `UserRole` relation. Replace the `role` string check with a `@Roles()` decorator + guard that checks for the required role in the user's role set.

### H3. Auth guard uses brittle token-passing pattern

`auth.guard.ts:20` takes the Bearer token from the `Authorization` header, prepends `"session="`, and sets it as a **header** (not a cookie). This is then read by Better Auth's `getSession()`. This breaks in serverless/edge environments where header mutation is restricted; it is also fragile if any middleware normalizes headers.

**Fix:** Either (a) pass the token via a proper cookie (`res.cookie(...)`) or (b) call Better Auth's token-validation API directly instead of proxying through `getSession()`.

### H4. No transaction isolation in wallet/escrow/payment operations

Wallet credit/debit, escrow release, and order-status transitions are not wrapped in Prisma `$transaction`. Under concurrent requests, double-spending, negative balances, and duplicate order fulfillment are possible.

**Fix:** Wrap all financial mutations in `prisma.$transaction([...])` with serializable isolation level. Add optimistic concurrency control for stock decrements (version field on Product).

### H5. No input validation on DTOs

Many DTOs define TypeScript types but use no `class-validator` decorators (`@IsString()`, `@IsEmail()`, `@Min()`, etc.). Invalid input reaches Prisma and may leak internal error messages. The global exception filter (`global-exception.filter.ts`) logs `exception.stack` without checking `NODE_ENV` — stack traces may be exposed in production.

**Fix:** Add `class-validator` decorators to all DTOs. Add a `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` globally. Mask stack traces in production responses.

### H6. Upload controller has no file-type or size validation

`UploadController.getSignature()` generates Cloudinary upload signatures for any client-authenticated user. There is no server-side file-type whitelist, no file-size limit, no virus scanning. An attacker could upload malicious files (scripts, malware, excessively large files) directly to Cloudinary.

**Fix:** Validate file type (MIME check), enforce max file size (e.g., 5MB for images, 50MB for videos), and consider a malware scan (ClamAV) before generating upload signatures.

### H7. Token stored in localStorage on web

The auth store (`auth-store.ts`) uses `expo-secure-store` on native but falls back to `localStorage` on web. `localStorage` is accessible by any JavaScript on the same origin (XSS vulnerability).

**Fix:** On web, use httpOnly cookies set by the server instead of client-side token storage. For Expo web, consider using a cookie-based session entirely.

### H8. No audit logging

Sensitive operations (role changes, withdrawals, dispute outcomes, admin actions) are not logged. In the event of a security incident, there is no trail to investigate.

**Fix:** Implement structured audit logging (Winston/Pino → stdout/file/S3). Log actor ID, action, resource, old/new state, IP, and timestamp for all sensitive operations.

---

## MEDIUM — Important for reliability, UX, and operations

### M1. No health-check endpoint

No `GET /health` or `/api/health` endpoint. Load balancers and orchestrators (Kubernetes, Docker Compose) cannot perform readiness/liveness probes.

**Fix:** Add `@Get('/health')` returning `{ status: 'ok', uptime, db: 'connected' }`.

### M2. No API versioning

All routes are under `/api/*` with no version prefix. Breaking schema changes cannot be introduced gracefully.

**Fix:** Prefix routes with `/api/v1/` and support content-negotiation (`Accept: application/vnd.bexiemart.v1+json`).

### M3. No email verification enforcement

`emailVerified` exists on the User schema, but no logic enforces it — unverified users can fully access the marketplace. No verification email flow was found.

**Fix:** Implement email verification on signup. Gate sensitive operations (vendoring, withdrawals) behind `emailVerified === true`.

### M4. Wallet PIN uses bcryptjs, not argon2

`wallet.service.ts` hashes wallet PINs with `bcryptjs` (cost 10). The mobile app also uses `bcryptjs` for local PIN validation. bcryptjs is acceptable, but **argon2id** is the OWASP-recommended standard for new applications.

**Fix:** Migrate to `argon2`. The brute-force protection (4 attempts → 24h freeze) mitigates some risk.

### M5. Dispatcher location updates have no validation

`dispatcher.service.ts` accepts raw `lat`/`lng` values with no bounds validation, geofence, or plausibility check. Invalid coordinates could break the dispatch system.

**Fix:** Validate coordinates against campus bounds. Reject out-of-range values (> 500m from campus center).

### M6. No database connection-pool configuration

`PrismaService` (`prisma.service.ts`) uses default Prisma connection settings — no pool size, no connection timeout, no retry logic, no slow-query logging.

**Fix:** Configure pool size, statement timeout, and logging in the Prisma `Datasource` or via the `PrismaClient` constructor.

### M7. Mobile .env hardcodes local IP

`apps/mobile/.env` contains `EXPO_PUBLIC_API_URL=http://192.168.x.x:5000/api` — will not work in production/staging without a manual edit.

**Fix:** Use environment-specific config via Expo's `extra` in `app.json` with EAS Build environment variables. The API URL should be set per release channel (dev/staging/prod).

### M8. Chat gateway token authentication is opaque

`chat.gateway.ts` tries to authenticate via the WebSocket handshake token. The method body is unclear about fallback behavior when token validation fails — unauthenticated sockets may be able to send messages.

**Fix:** Add explicit `@ConnectedSocket()` guard that throws `WsException` for invalid/missing tokens, with rate-limiting applied to all socket events (currently only messages have rate-limiting).

### M9. No monitoring or error tracking

No Sentry, DataDog, or any APM/RUM integration on either server or mobile. Production errors will be silent unless manually grepping server logs.

**Fix:** Add `@sentry/node` + `@sentry/react-native` with source maps.

---

## LOW — Polish, DX, and non-critical improvements

### L1. No feature flags / gradual rollout mechanism

No LaunchDarkly or PostHog feature flags. All users see the same code — no ability to A/B test or gradual-rollout risky features.

### L2. No serverless-ready Docker or nginx config

No `Dockerfile`, no `docker-compose.yml`, no `nginx.conf`, no deployment scripts. Prisma needs to be in the container build step.

### L3. No unit or e2e tests

No test files found. Guards, services, and controllers have no tests. No Jest or Vitest config in the server.

### L4. Flash-sales module is minimal — no scheduler

`flash-sales.controller.ts` and service exist but rely on manual `startDate`/`endDate` checks in queries. No queue worker (Bull, RabbitMQ) or cron job to activate/deactivate sales.

### L5. No accessibility labels on mobile

No `accessibilityLabel`, `accessibilityRole`, or `aria-*` attributes on UI elements. The app is not usable with screen readers.

### L6. No code-push / OTA updates

No EAS Update or CodePush integration — every mobile change requires a full app store re-submission.

### L7. Admin endpoints lack platform-config CRUD

`AdminService` and `AdminController` exist but `GET /admin/config` is missing. `UpdateConfigDto` exists but there is no way to read the current config. No platform analytics dashboard.

### L8. Dispute resolution has no admin workflow

`escrow.service.ts` supports dispute creation and manual release, but there is no admin UI or API for reviewing disputes, communicating with parties, or tracking resolution SLAs.

### L9. No Prisma indexes on common query patterns

No explicit indexes on `userId` + `status` in Order, `productId` + `userId` in Review, or `vendorId` in Product. Large datasets will suffer from full-table scans.

### L10. Mobile uses 4 font-family combinations

The theme defines `font-heading` (Plus Jakarta Sans), `font-body` (Inter), plus `Space Grotesk` and `Clash Display` in some screens. This causes visual inconsistency and increases bundle size. Pick 2 families max.

---

## Summary

| Severity | Count | Key Items |
|----------|-------|-----------|
| CRITICAL | 5 | CORS, webhook security, rate-limiting, helmet, HTTPS |
| HIGH | 8 | Refresh tokens, RBAC, auth guard pattern, transactions, validation, upload, localStorage tokens, audit logging |
| MEDIUM | 9 | Health check, API versioning, email verification, wallet PIN, dispatcher validation, Prisma config, mobile env, chat auth, monitoring |
| LOW | 10 | Feature flags, Docker, tests, flash sales, a11y, code-push, admin config, disputes, DB indexes, fonts |

**Next recommended actions:**
1. Fix all 5 CRITICAL items immediately before any production deployment
2. Address the 8 HIGH items before user onboarding/marketing launch
3. Apply MEDIUM items during first sprint after launch
4. Track LOW items in the backlog

---

*Audit generated 2026-05-31 by static code analysis. Findings should be validated against a staging environment before prioritizing remediation.*
