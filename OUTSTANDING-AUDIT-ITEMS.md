# Outstanding Audit Items

Remaining work from `AUDIT-CHECKLIST.md` after Phase 1–3 remediation.

## Legend

| Icon | Meaning |
|------|---------|
| 🔴   | Not started |
| 🟡   | Partially done |
| 🟢   | Fixed — included here for context |

---

## CRITICAL — 1 remaining [🔴]

### C5 — Enforce HTTPS (`main.ts`)
- `app.set("trust proxy", 1)` is set
- **Missing**: No HTTP→HTTPS redirect guard or middleware
- **Fix**: Add a middleware that checks `req.secure`/`req.headers["x-forwarded-proto"]` and redirects HTTP to HTTPS, or enforce at reverse-proxy level (nginx/Caddy)

---

## HIGH — All addressed [🟢]

| Item | Status | Notes |
|------|--------|-------|
| C1 CORS | 🟢 | `app.enableCors({ origin: whitelist, credentials: true })` at `main.ts:20-23` |
| C2 Webhook | 🟢 | HMAC SHA-512 verification at `payments.controller.ts:37` |
| C3 Rate limiting | 🟢 | Global `ThrottlerGuard` + per-endpoint limits on auth/wallet/orders/coupons/admin |
| C4 Helmet | 🟢 | `app.use(helmet())` at `main.ts:18` |
| H1 JWT refresh | 🟢 | Handled by Better Auth internally (token rotation + session management) |
| H2 Multi-role | 🟢 | Wontfix — single-role kept with guard protection; documented in `ROLE-CHECKLIST` |
| H3 Auth guard | 🟢 | Bearer token parsed → better-auth `getSession()` API properly called |
| H4 Transactions | 🟢 | `$transaction` with `Serializable` on all financial mutations |
| H5 Input validation | 🟢 | `class-validator` on all DTOs + `ValidationPipe({ whitelist, forbidNonWhitelisted })` |
| H6 Upload validation | 🟢 | `allowed_formats` + `ParseFilePipe` with size/type guards |
| H7 Token storage | 🟢 | `Map` in-memory (web) / `SecureStore` (native) |
| H8 Audit logging | 🟢 | `audit-logger.middleware.ts` logging actor, action, resource, IP, timestamp |

---

## MEDIUM — 5 remaining, 1 partial [🔴🟡]

### M3 — Email verification enforcement [🔴]
- `emailVerified` field exists in Prisma schema
- **Missing**: No verification email on signup, no enforcement gating vendoring/withdrawals/admin actions
- **Fix**: Implement email verification flow (send email with token, verify endpoint), gate sensitive operations behind `emailVerified === true`

### M4 — Migrate wallet PIN to argon2 [🔴]
- `wallet.service.ts:4` imports `bcryptjs` instead of `argon2`
- **Fix**: Replace bcryptjs → argon2id; keep existing brute-force freeze logic (5-failure lockout, PIN attempt tracking)

### M5 — Validate dispatcher coordinates [🔴]
- `dispatcher.service.ts:56` accepts raw `lat: number, lng: number`
- **Missing**: No bounds validation (e.g., ±500m from campus center) or plausibility check
- **Fix**: Add validation for realistic lat/lng ranges, optionally constrain to operating area

### M6 — Prisma connection pool config [🔴]
- **Missing**: No custom `PrismaClient` constructor with pool size, statement timeout, connection retry, or slow-query logging
- **Fix**: Configure `PrismaClient({ log, datasources: { db: { url } } })` with connection pool parameters

### M7 — Environment-specific API URL [🟡]
- `eas.json` has per-channel `EXPO_PUBLIC_API_URL` for `preview` and `device` profiles, but:
  - `production` build profile has **no env vars** defined (`"autoIncrement": true` only)
  - `.env` still has a hardcoded local IP (`http://172.20.10.4:3000/api/v1`)
- **Fix**: Add `EXPO_PUBLIC_API_URL` to production build profile with production URL; ensure all channels covered

### M9 — Error monitoring (Sentry) [🔴]
- **Missing**: No `@sentry/node` or `@sentry/react-native` found anywhere
- **Fix**: Integrate Sentry for both server (source maps) and mobile; configure error tracking + performance monitoring

---

## LOW — 6 remaining [🔴]

### L1 — Feature flags [🔴]
- **Fix**: Add LaunchDarkly / PostHog for gradual rollouts, A/B testing, kill switches

### L2 — Docker & deployment config [🔴]
- **Fix**: Add `Dockerfile`, `docker-compose.yml`, `nginx.conf`, deployment scripts

### L4 — Flash sales scheduler [🔴]
- **Fix**: Add Bull/RabbitMQ queue or cron job to activate/deactivate flash sales instead of query-time checks

### L5 — Accessibility labels (mobile) [🔴]
- **Fix**: Add `accessibilityLabel`, `accessibilityRole`, `aria-*` to all interactive elements

### L6 — OTA updates [🔴]
- `eas.json` has `"appVersionSource": "remote"` but no `"update"` section or channel config
- **Fix**: Configure EAS Update for over-the-air mobile patches

### L10 — Consolidate fonts (mobile) [🔴]
- **Fix**: Reduce from 4 font families to 2 (heading + body) for visual consistency and smaller bundle size

---

## Summary

| Priority | Total | Fixed 🟢 | Partial 🟡 | Remaining 🔴 |
|----------|-------|----------|------------|-------------|
| Critical | 5 | 4 | 0 | **1** |
| High | 8 | 8 | 0 | **0** |
| Medium | 9 | 3 | 1 | **5** |
| Low | 10 | 4 | 0 | **6** |
| **Total** | **32** | **19** | **1** | **12** |

**Overall completion: ~59%** (19/32 fixed, 59% — or 60% counting partial as half)
