# Outstanding Remediation Checklist

Tracking remaining work after Phases 1–3.

---

## CRITICAL

- [ ] **C5 — Enforce HTTPS** (`main.ts`)
  Add an HTTP→HTTPS redirect guard or enforce at reverse-proxy level (nginx/Caddy).
  `app.set("trust proxy", 1)` is already in place.

---

## MEDIUM

- [ ] **M3 — Email verification enforcement**
  Implement verification email on signup. Gate vendoring, withdrawals, and admin actions behind `emailVerified === true`.

- [ ] **M4 — Migrate wallet PIN from bcryptjs → argon2** (`wallet.service.ts`)
  Replace bcryptjs with argon2id. Keep existing brute-force freeze logic (5-failure lockout, attempt tracking).

- [ ] **M5 — Validate dispatcher coordinates** (`dispatcher.service.ts`)
  Add bounds check (e.g., ±500m from campus center). Reject implausible lat/lng values.

- [ ] **M6 — Prisma connection pool config** (`prisma.service.ts`)
  Set pool size, statement timeout, connection retry, and slow-query logging in PrismaClient constructor.

- [ ] **M7 — Environment-specific API URL** (`mobile/.env` / `eas.json`)
  Add `EXPO_PUBLIC_API_URL` to production build profile in `eas.json`. Move hardcoded local IP out of `.env`.

- [ ] **M9 — Add error monitoring**
  Integrate Sentry (`@sentry/node` + `@sentry/react-native`) with source maps for both server and mobile.

---

## LOW

- [ ] **L1 — Feature flags**
  Add LaunchDarkly / PostHog for gradual rollouts and A/B testing.

- [ ] **L2 — Docker & deployment config**
  Add `Dockerfile`, `docker-compose.yml`, `nginx.conf`, and deployment scripts.

- [ ] **L4 — Flash-sales scheduler**
  Add Bull/RabbitMQ queue or cron job to activate/deactivate flash sales instead of query-time checks.

- [ ] **L5 — Accessibility labels** (mobile)
  Add `accessibilityLabel`, `accessibilityRole`, and `aria-*` to all interactive elements.

- [ ] **L6 — OTA updates**
  Integrate EAS Update for over-the-air mobile patches without app store resubmission.

- [ ] **L10 — Consolidate fonts** (mobile)
  Reduce from 4 font families to 2 (heading + body) for visual consistency and smaller bundle size.

---

## Quick summary

```
CRITICAL:  █░░░░░░░░░░░░░░░░░░░  0/1
MEDIUM:    ░░░░░░░░░░░░░░░░░░░░  0/6
LOW:       ░░░░░░░░░░░░░░░░░░░░  0/6
```

Replace `[ ]` with `[x]` as items are completed.
