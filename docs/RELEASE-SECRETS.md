# Release Secrets & Environment Configuration

Required configuration before shipping to production. Nothing in this file is
optional — every item below corresponds to a feature that breaks silently or
loudly without it.

---

## 1. Mobile (EAS builds)

Secrets are **no longer committed** in `apps/mobile/eas.json` (the `production`,
`preview`, and `device` profiles intentionally omit them). Provide them as
channel-scoped EAS environment variables:

```bash
cd apps/mobile

# Payments — REQUIRED or the app throws on boot (by design, see app/_layout.tsx).
# Use the LIVE key (pk_live_...) for the production channel.
eas env:create --name EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY --value "pk_live_..." --environment production
eas env:create --name EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY --value "pk_test_..." --environment preview

# Google Maps — REQUIRED for delivery tracking / map views (blank maps otherwise).
# Create keys in Google Cloud Console → Maps SDK for Android + iOS, restricted
# to com.bexiemart.app (Android) and the iOS bundle ID.
eas env:create --name GOOGLE_MAPS_ANDROID_API_KEY --value "AIza..." --environment production
eas env:create --name GOOGLE_MAPS_IOS_API_KEY     --value "AIza..." --environment production
```

Notes:
- `app.config.ts` injects `GOOGLE_MAPS_*` at build time; `EXPO_PUBLIC_*` vars
  are compiled into the JS bundle. Both are read during `eas build`.
- The `development` profile keeps a test Paystack key on purpose (local dev);
  it never ships to stores.
- Sentry: production crashes are tagged by `EXPO_PUBLIC_ENV`. Set it so events
  are not mislabeled:

```bash
eas env:create --name EXPO_PUBLIC_ENV --value production --environment production
```

- App Store / Play submission config in `eas.json > submit.production` still
  contains placeholder Apple IDs and expects `./google-api-key.json`
  (service account key). Fill these before store submission.

## 2. Backend (Railway / docker-compose)

Set in the Railway dashboard (or a root `.env` consumed by `docker compose`):

| Variable | Purpose |
|---|---|
| `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `BETTER_AUTH_SECRET` | **Required** — compose aborts with a clear error if missing (no insecure fallbacks exist anymore) |
| `DATABASE_URL` | Postgres connection (managed DB or compose service) |
| `BETTER_AUTH_API_KEY` | Auth signing — generate with `openssl rand -hex 32` |
| `PAYSTACK_SECRET_KEY` | Live `sk_live_...`; webhook HMAC fails closed without it |
| `CORS_ORIGIN` | Comma-separated allowed origins incl. your admin domain |
| `ENFORCE_HTTPS` | Defaults to `true` in compose; leave unset unless debugging |
| `RESEND_API_KEY`, `SENTRY_DSN`, `POSTHOG_API_KEY` | Email / errors / analytics |

Deployment ergonomics:
- `cp .env.example .env` gives you the full template; **`scripts/deploy.sh`
  / `deploy.ps1` auto-generate strong random values for the four required
  secrets** if they're empty, and exit non-zero if the final health check fails.
- The API container now runs as a non-root user with a built-in
  `HEALTHCHECK`; boot-time seed failures log loudly to stderr instead of being
  swallowed by `\|\| true`.
- CI builds both production Docker images on every relevant PR
  (`docker-admin` / `docker-server` jobs), so context/COPY drift fails before
  merge rather than at deploy time.

## 3. Self-hosted TLS

See [`nginx/tls/README.md`](../nginx/tls/README.md). Until a `.conf` file is
dropped in `nginx/tls/`, the stack serves HTTP only; the HTTPS listener and
HSTS activate together once certificates exist.

## 4. Credential rotation checklist

The following real credentials have existed in **untracked local `.env`
files** on developer machines (`apps/server/.env`, `apps/mobile/.env`). Rotate
any of them if a machine was ever shared, and prefer secret managers going
forward: database password, SMTP credentials, Google OAuth client secret,
Arkesel SMS key, Sentry auth token, Paystack keys.

## 5. Pre-launch verification

```bash
# Mobile
cd apps/mobile && npx expo config --type prebuild   # confirm keys resolve, no warnings
npx tsc && npm run lint

# Compose stack
docker compose build                                 # admin image must build
docker compose exec nginx nginx -t                   # after adding tls/bexiemart.conf
curl -I https://your-domain/api/v1/health            # expect 200 over TLS
```
