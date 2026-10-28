# docs/infrastructure/ACCOUNTS.md

# Company Infrastructure Accounts (SEC-114)

**Purpose:** Record that every production resource is owned by a company account (not a personal developer account), with MFA enabled and a second admin.

**Status:** Draft — to be completed by company IT admin.

## 1. Account inventory

| Resource | Provider | Company account (not personal) | Owner email | MFA | Second admin | Notes |
|----------|----------|-------------------------------|-------------|-----|--------------|-------|
| GitHub repository | GitHub | Company org | | | | `Aeomar999/Bexiemart` → transfer to org |
| Container images | GHCR | Company org | | | | `ghcr.io/<org>/...` |
| Mobile builds/OTA | Expo | Company Expo org | | | | `app.json` owner: company org |
| Admin dashboard | Vercel | Company Vercel team | | | | Scope → company team |
| API hosting | Render | Company Render org | | | | `bexiemart-api` service → company org |
| Database | Neon | Company Neon org | | | | Projects `bexiemart-production`, `bexiemart-staging` |
| DNS / edge | Cloudflare | Company Cloudflare account | | | | `bexiemart.com` zone |
| VPS / edge proxy | Hostinger | Company Hostinger account | | | | VPS IP |
| Transactional email | Resend | Company Resend account | | | | Domain `bexiemart.com` verification |
| Payments | Paystack | Company Paystack account | | | | Live keys for production |
| Apple Developer Program | Apple | Company Apple Developer account | | | | Used for App Store Connect org enrollment |
| Google Play Console | Google | Company Google Play developer account | | | | One-time $25 USD fee |
| Secrets / password manager | (TBD) | Company vault | | | | `JWT_SECRET`, `ADMIN_JWT_SECRET`, DB credentials |

## 2. Acceptance criteria (SEC-114)

- [ ] Every production resource is owned by a company account with MFA
- [ ] A second admin (not the developer) has access to each account
- [ ] Ownership recorded here (`docs/infrastructure/ACCOUNTS.md`)
- [ ] Access matrix in `docs/infrastructure/ACCESS.md`

## 3. Migration notes

- GitHub: transfer repo `Aeomar999/Bexiemart` → company org, or create org and move the repo.
- GHCR: images under company org namespace; ensure the org owns the namespace.
- Expo: create company org, transfer app, update `app.json` `"owner"`.
- Vercel: create company team, transfer project, update `CORS_ORIGIN` if needed.
- Render: create company org, transfer `bexiemart-api` service, rotate `JWT_SECRET`/`ADMIN_JWT_SECRET`.
- Neon: create company org, projects `bexiemart-production` and `bexiemart-staging`, least-privilege users per environment, MFA, IP allowlist (VPS + Render during transition).
