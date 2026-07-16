# Bexiemart Launch-Day Checklist

## Payments (the money gate)
- [ ] Swap Paystack **test → live** public key in `apps/mobile/eas.json` (all profiles) and the live secret in the server env (`PAYSTACK_SECRET_KEY`). The loud test-mode banner (Task 3) disappears automatically once the key is not `pk_test_`.
- [ ] Register the **live** Paystack webhook URL → `https://<api-host>/api/v1/payments/webhook`; confirm HMAC secret matches `PAYSTACK_SECRET_KEY`.
- [ ] Run one real end-to-end payment + payout in production; confirm webhook + escrow.

## Mobile store submission
- [ ] Replace `submit.production.ios` placeholders `ascAppId` + `appleTeamId` (Task 2 `_TODO`) with real App Store Connect values.
- [ ] Provide `apps/mobile/google-api-key.json` (Play service account) — never commit it.
- [ ] Build production AAB (`eas build -p android --profile production`) and iOS; submit.

## Server / infra
- [ ] Set production env on Railway: `DATABASE_URL`, `BETTER_AUTH_*`, `GOOGLE_CLIENT_*`, `PAYSTACK_SECRET_KEY`, `CLOUDINARY_*`, `ADMIN_ORIGIN=https://<vercel-admin-domain>`, SMTP.
- [ ] Confirm `railway.json` health check passes post-deploy; `migrate deploy` ran.
- [ ] Seed the super-admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD` out-of-band, run `seed-admin`), the SYSTEM user, and banners.

## Admin
- [ ] Deploy admin (Vercel) with `API_URL` + `NEXT_PUBLIC_API_URL`; confirm login sets the httpOnly cookie and the `admin` CI job is green.
- [ ] Verify `ADMIN_ORIGIN` is in the server `trustedOrigins` (env) so CSRF-checked routes work from prod admin.

## Smoke tests (production)
- [ ] Customer: browse → add to cart → checkout (live) → track order.
- [ ] Vendor: create product → receive order → withdraw (PIN).
- [ ] Dispatcher: accept job → deliver → withdraw.
- [ ] Reels: upload a real video → plays → comment.
