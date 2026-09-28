# Bexiemart Production Readiness Audit

**Project:** Bexiemart — Campus E-Commerce Marketplace (Ghana)  
**Stack:** NestJS 10 (API) + Next.js 16 (Admin) + Expo 54/React Native 0.81 (Mobile)  
**Database:** PostgreSQL 16 + Prisma 7.8 | **Cache:** Redis 7  
**Auth:** Better-Auth 1.6 (email/password, Google OAuth, phone OTP, 2FA)  
**Payments:** Paystack (cards, MoMo, bank transfer) | **Files:** Cloudinary  
**Real-time:** Socket.IO (3 namespaces) | **Monitoring:** Sentry + PostHog + Winston  

---

## Executive Summary

| Dimension | Score | Status |
|-----------|-------|--------|
| **Feature Completeness** | 9.5/10 | ~95% — All core features implemented |
| **Security Posture** | 8.5/10 | Strong app-level security, **secrets exposed in repo** |
| **API Design** | 9/10 | RESTful, versioned, 180+ endpoints, Swagger docs |
| **Database Design** | 9/10 | 57 models, proper indexes, migrations |
| **Test Coverage** | 5.5/10 | Server good, mobile OK, **admin near zero** |
| **CI/CD** | 3/10 | Configs exist but **no active pipeline** |
| **Email Delivery** | 4/10 | **SMTP blocked on Railway, Resend not integrated** |
| **Maps/Location** | 5/10 | Code ready, **API key not provisioned** |
| **Operational Readiness** | 5.5/10 | No load testing, no runbooks, missing push notifications |
| **Overall** | **7.0/10** | **NOT production-ready** — 3 critical blockers |

---

## 🔴 CRITICAL BLOCKERS (Must Fix Before Launch)

| # | Issue | Impact | Effort | Files/Location |
|---|-------|--------|--------|----------------|
| **1** | **Secrets exposed in repository** | DB password, Paystack keys, Google OAuth, Cloudinary secret, SMTP password, Sentry/PostHog keys all in `.env` files that may be in git history | 2 hrs | `apps/server/.env`, `apps/mobile/.env`, `apps/admin/.env.local` |
| **2** | **Email delivery broken on Railway** | Railway blocks SMTP ports (25/465/587). Nodemailer/Titan Mail will fail. No verification emails, password resets, order confirmations in production. SMS OTP still works. | 1 day | `apps/server/src/auth/mail-transporter.ts` → integrate `resend` package |
| **3** | **Google Maps API key not provisioned** | Delivery pricing uses Haversine estimates (inaccurate). No route polyline, no geocoding, unreliable ETAs. | 30 min + $200/mo | `apps/server/src/modules/maps/routes.service.ts:40` |

**Action Required Immediately:**
1. Rotate ALL exposed credentials (DB, Paystack, Google, Cloudinary, SMTP, Sentry, PostHog, Resend, Arkesel)
2. Purge `.env` files from git history: `bfg --delete-files .env`
3. Add `resend` npm package, create HTTPS-based email transport, add `EMAIL_PROVIDER=resend|smtp` toggle
4. Provision Google Maps Platform API key with Routes + Geocoding APIs enabled

---

## 🟡 HIGH PRIORITY (Should Fix Before Launch)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| **4** | **No active CI/CD pipeline** | GitHub Actions workflow exists (`.github/workflows/ci.yml`) but not confirmed active. Breaking changes can reach production. | 1 day |
| **5** | **Admin app near-zero test coverage** | 2 test files / 48+ source files (~4%). Financial errors, incorrect vendor approvals, missed disputes possible. | 2-3 days |
| **6** | **Missing payment-methods controller for customers** | Mobile calls 5 endpoints that 404: `GET /payment-methods`, `POST /payment-methods/card`, `POST /payment-methods/momo`, `DELETE /payment-methods/:id`, `PATCH /payment-methods/:id/default` | 1 hr |
| **7** | **Path mismatch: `/wallet/cards/verify-save` vs `/wallet/cards/verify`** | Mobile calls wrong endpoint — 404 in production | 5 min |
| **8** | **Missing order cancel endpoint** | Mobile calls `POST /orders/:id/cancel` — no server route | 30 min |
| **9** | **No Redis in Railway deployment** | Docker Compose has Redis, but Railway deployment doesn't provision it. Session caching & rate limiting affected. | 1 hr |
| **10** | **Push notifications not sending** | Mobile registers tokens but no server-side push service. No proactive order/message/promo notifications. | 1-2 days |
| **11** | **Dependency version conflicts** | Jest 30 vs ts-jest 29, Zustand 5 vs 4, Socket.IO 4.8.3 vs 4.7.5, mobile E2E is Windows-only `.bat` | 2 hrs |

---

## 🟢 MEDIUM PRIORITY (Nice to Have Before Launch)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| **12** | **No load testing** | Unknown performance under flash sales, peak hours, concurrent deliveries | 1-2 days |
| **13** | **Story module has no API endpoints** | Schema has `Story`/`StoryView` models but no controller — feature exists in DB but not accessible | 2 hrs |
| **14** | **Admin dashboard missing key endpoints** | `GET /admin/dashboard`, `GET /admin/disputes`, `POST /admin/disputes/:id/resolve`, `GET /admin/reports/revenue`, `GET /admin/reports/users` | 2-3 hrs |
| **15** | **Swagger not served at live endpoint** | `/api/docs` not accessible in production | 1 hr |
| **16** | **No Prometheus metrics endpoint** | `GET /metrics` missing for monitoring | 30 min |
| **17** | **Missing database indexes** | `Escrow.vendorWalletId`, `ServiceBooking.status`, `DispatcherProfile.lastLocationAt`, `VendorDocument.status`, `Notification.type` | 30 min |
| **18** | **Missing cascade deletes** | `Wallet→BankAccount`, `Wallet→MomoAccount`, `Wallet→Transaction`, `User→Wallet` | 30 min |
| **19** | **Missing unique constraint** | `FoodOrderItem` needs `@@unique([orderId, foodItemId])` | 5 min |
| **20** | **Food cart vs main cart duplication** | Two independent cart systems — architectural decision needed | 2 hrs |

---

## ✅ STRENGTHS (Already Production-Grade)

| Area | Status | Evidence |
|------|--------|----------|
| **Authentication** | ✅ | Better-Auth with email/password, Google OAuth, phone OTP, 2FA TOTP, 7-day sessions |
| **Authorization** | ✅ | 7 guard types (Auth, Admin, Vendor, Dispatcher, SuperAdmin, OptionalAuth, EmailVerified) |
| **Payment Integration** | ✅ | Full Paystack integration with webhook HMAC-SHA512, escrow per-vendor, commission deduction |
| **Rate Limiting** | ✅ | Global (60/min), auth (5/min), per-route, nginx zones (api_limit 30r/s, auth_limit 5r/s) |
| **Input Validation** | ✅ | 42 DTOs with class-validator, global ValidationPipe (whitelist + forbidNonWhitelisted) |
| **XSS/SQLi Protection** | ✅ | Input sanitizer middleware strips tags/scripts, prototype pollution guard |
| **SSRF Guard** | ✅ | Blocks private IPs, localhost, cloud metadata endpoints on upload/webhook routes |
| **Financial Race Conditions** | ✅ | All wallet/escrow mutations use `$transaction` with `Serializable` isolation |
| **Wallet Security** | ✅ | PIN hashing with argon2id, 5-attempt lockout, bcrypt→argon2 migration |
| **Audit Logging** | ✅ | Middleware logs sensitive actions (withdraw, transfer, login, register, dispute resolve) |
| **HTTPS Enforcement** | ✅ | Production redirect via `x-forwarded-proto` check |
| **Helmet Security Headers** | ✅ | Full CSP, HSTS, X-Frame-Options, etc. configured in nginx |
| **Connection Pooling** | ✅ | PrismaPg with PgPool (max 20, idle 30s, timeout 5s) + slow query logging |
| **WebSocket Architecture** | ✅ | 3 namespaces (/chat, /delivery, /admin) with rate limiting (30 msg/min) |
| **Mobile OTA Updates** | ✅ | EAS Update configured with channels (dev/preview/device/production) |
| **Accessibility** | ✅ | Complete audit — all interactive elements have `accessibilityRole/State/Label` |
| **Docker/Deployment** | ✅ | Multi-stage Dockerfiles, docker-compose with healthchecks, nginx reverse proxy |

---

## 📋 PRE-LAUNCH CHECKLIST

### Must-Fix (Critical — 1-2 days)
- [ ] Rotate all secrets (DB, Paystack, Google, Cloudinary, SMTP, Sentry, PostHog, Resend, Arkesel)
- [ ] Purge `.env` from git history with BFG Repo-Cleaner
- [ ] Integrate Resend for email (bypass Railway SMTP blocking)
- [ ] Provision Google Maps API key (Routes + Geocoding APIs)
- [ ] Create Privacy Policy & Terms of Service (required for app stores)

### Should-Fix (High — 3-5 days)
- [ ] Activate GitHub Actions CI pipeline
- [ ] Add Jest + React Testing Library to admin app (dashboard, orders, vendors, settings)
- [ ] Create CustomerPaymentMethodsController (5 missing endpoints)
- [ ] Fix wallet cards verify path mismatch
- [ ] Add order cancel endpoint
- [ ] Add Redis to Railway deployment
- [ ] Wire push notification sending service
- [ ] Fix dependency version conflicts (Jest, Zustand, Socket.IO)
- [ ] Make mobile E2E script cross-platform

### Nice-to-Have (Medium — 1-2 weeks)
- [ ] Load testing (k6/Artillery: 100+ concurrent, flash sale scenarios)
- [ ] Implement Story module API endpoints
- [ ] Add admin dashboard/reports/disputes endpoints
- [ ] Serve Swagger at `/api/docs`
- [ ] Add Prometheus `/metrics` endpoint
- [ ] Add missing DB indexes and cascade deletes
- [ ] Decide: merge food cart + main cart or document separation
- [ ] Prepare app store listings (screenshots, descriptions, metadata)
- [ ] Create user documentation (FAQ, help center, onboarding)

---

## Estimated Timeline to Production-Ready

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Fix 3 critical blockers | 1-2 days | Access to all service dashboards, Google Cloud billing |
| High-priority fixes | 3-5 days | CI/CD setup, admin test infrastructure |
| Medium-priority fixes | 1-2 weeks | Load testing tool, legal review for policies |
| **Total** | **7-12 business days** | |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Email non-delivery in production** | Certain (Railway blocks SMTP) | Critical — no verification, no password reset | **Fix immediately: Resend integration** |
| **Secrets compromised** | High (files in repo) | Critical — DB access, payment fraud, impersonation | **Rotate + purge history immediately** |
| **Inaccurate delivery pricing** | Certain (no Maps API) | High — customer complaints, vendor losses | **Provision API key** |
| **Admin panel bugs in production** | Medium | High — financial errors, wrong approvals | **Add test coverage + CI** |
| **Flash sale performance collapse** | Medium | High — revenue loss, user trust | **Load test before launch** |
| **Push notifications silent** | Certain (no server impl) | Medium — reduced engagement | **Implement Expo push service** |

---

## Recommendation

**Do NOT launch to production until the 3 critical blockers are resolved.** The platform is architecturally sound with excellent security practices and feature completeness, but the email/SMTP issue alone makes user onboarding impossible on Railway. Once those are fixed (1-2 days), proceed to a **controlled beta launch on 1-2 campuses** with monitoring, then scale.

The codebase demonstrates strong engineering practices: proper transaction isolation, comprehensive guards, audit logging, input sanitization, and solid architecture. The remaining work is primarily operational (CI/CD, testing, infrastructure provisioning) rather than fundamental rewrites.