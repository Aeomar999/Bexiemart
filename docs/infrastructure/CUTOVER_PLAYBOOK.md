# Live Infrastructure & DNS Cutover Playbook
**Document:** `docs/infrastructure/CUTOVER_PLAYBOOK.md`  
**Applies to:** Bexiemart infrastructure cutover  
**Target Domain:** `bexiemart.com`  
**Audience:** IT Administrator, DevOps Engineer, Backend Engineer  

---

## 1. Executive Summary & Zero-Downtime Objective

This playbook defines the exact sequence for executing the live cloud infrastructure provisioning and DNS traffic cutover for Bexiemart.

### Non-Negotiable Cutover Guarantees:
1. **Zero Disruption to Active Website:** If a corporate/marketing website is running on Hostinger, it must not drop a single visitor request during or after nameserver cutover.
2. **Zero Disruption to Business Email:** Existing email delivery for `bexiemart.com` depends on existing MX and SPF/DKIM records. These records must be pre-staged in Cloudflare **prior** to nameserver delegation.
3. **Zero Invalidation of User Sessions:** The active Render deployment generated dynamic `JWT_SECRET` and `ADMIN_JWT_SECRET` on boot. When launching the production container on the Hostinger VPS, these exact secrets must be extracted from Render and injected into the VPS production environment (`/opt/bexiemart/production/api.env`). Failure to replicate these secrets will log out every active mobile user and admin session.
4. **Single-Level Subdomain Architecture (Decision D1):** Cloudflare's free Universal SSL covers only single-level subdomains (`api.`, `staging-api.`, `admin.`, `staging-admin.`, `dev-api.`). Multi-level names (such as `staging.api.` or `staging.admin.`) are strictly disallowed.
5. **No Exposed Backend Ports:** Ports 4000 (API) and 6379 (Redis) must never be published to the public internet. Caddy edge proxy terminates TLS using Cloudflare Authenticated Origin Pulls (AOP) on ports 80/443.

---

## 2. Pre-Cutover Checklist

Before scheduling the cutover window, verify the following status across all external cloud provider consoles:

| Track | Provider | Required State | Verification Command / Metric |
|---|---|---|---|
| **M1** | GitHub | Organization created, 2FA enforced, `main` protected, `production` environment review gate enabled | Settings -> Environments -> `production` |
| **M2** | Password Manager | Company vault (Bitwarden / 1Password) contains root credentials and recovery codes | Item names documented in `ACCOUNTS.md` |
| **M3** | Cloudflare | Free zone `bexiemart.com` added; records imported from `CLOUDFLARE_ZONE_RECORDS.bind` | Cloudflare DNS Dashboard |
| **M4** | Hostinger VPS | Ubuntu 24.04 LTS; `platform/vps/bootstrap.sh` executed | `ssh deploy@<VPS_IP> "docker ps"` |
| **M5** | Neon (PostgreSQL) | Company Neon org; separate projects `bexiemart-production` and `bexiemart-staging`; VPS IP whitelisted | Neon Network Access list |
| **M6** | Vercel | Company team account; `bexiemart-admin` imported; custom environment `staging` and domains assigned | Vercel Project Settings |
| **M7** | Expo EAS | Company Expo organization; `app.json` owner updated; `EXPO_TOKEN` robot token generated | `eas whoami` |
| **M8** | Sentry | Projects `bexiemart-api`, `bexiemart-admin`, `bexiemart-mobile` configured | Sentry Projects dashboard |
| **M9** | Cloudflare R2 | Storage bucket `bexiemart-backups` created with lifecycle rules | `aws s3 ls --endpoint-url https://...` |
| **M10** | Resend | Domain `bexiemart.com` created and verified | Resend Domains tab |
| **M11** | Paystack | Live keys configured; webhook URL `https://api.bexiemart.com/api/v1/payments/webhook` set | Paystack Dashboard |

---

## 3. Phase 1: DNS Pre-Staging & Nameserver Delegation (Track M3)

### Step 1.1: Import BIND Records into Cloudflare
1. Log in to the company Cloudflare dashboard.
2. Click **Add a site** -> enter `bexiemart.com` -> Select **Free** plan.
3. In the left navigation, open **DNS** -> **Records**.
4. Click **Manage** -> **Import and Export**.
5. Upload [`docs/infrastructure/CLOUDFLARE_ZONE_RECORDS.bind`](file:///c:/Users/Jerry/Desktop/Bexiemart/docs/infrastructure/CLOUDFLARE_ZONE_RECORDS.bind).
6. Verify all records populated:
   - Root `A` records: pointing to your Hostinger VPS IP (DNS only / Proxied off for initial test)
   - `www` `CNAME`: `www.bexiemart.com` (if applicable)
   - `MX`: for your email provider
   - `TXT`: SPF and DKIM records for your email provider

### Step 1.2: Configure Cloudflare SSL/TLS & Edge Security
1. Navigate to **SSL/TLS** -> **Overview**:
   - Set encryption mode to **Full (strict)**.
2. Navigate to **SSL/TLS** -> **Origin Server**:
   - Enable **Authenticated Origin Pulls** (toggle ON).
   - Click **Create Certificate** -> Generate an Origin CA certificate covering `bexiemart.com` and `*.bexiemart.com` (Validity: 15 years).
   - Save the certificate as `origin.crt` and private key as `origin.key`.
3. Navigate to **Network**:
   - Enable **WebSockets** (required for Socket.io real-time notifications).
   - Enable **gRPC** and **HTTP/3 (with QUIC)**.

### Step 1.3: Update Nameservers at Hostinger Registrar
1. Log in to Hostinger hPanel -> **Domains** -> `bexiemart.com`.
2. Locate **Nameservers**.
3. Click **Change Nameservers** -> select **Custom Nameservers**.
4. Replace with the assigned Cloudflare nameservers (e.g. `aria.ns.cloudflare.com` and `gabe.ns.cloudflare.com`).
5. Save changes.
6. Verify delegation without dropped traffic:
   ```bash
   nslookup -type=NS bexiemart.com 8.8.8.8
   nslookup -type=MX bexiemart.com 8.8.8.8
   nslookup bexiemart.com 8.8.8.8
   ```

---

## 4. Phase 2: Hostinger VPS Edge Setup (Plan 4b)

### Step 2.1: Bootstrap Hostinger VPS
1. SSH into the freshly deployed Ubuntu 24.04 VPS as `root`:
   ```bash
   ssh root@<VPS_IP>
   ```
2. Clone repository or copy `platform/vps/bootstrap.sh` onto the server:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/Aeomar999/Bexiemart/main/platform/vps/bootstrap.sh -o /tmp/bootstrap.sh
   bash /tmp/bootstrap.sh
   ```
3. Verify that:
   - User `deploy` is created in group `docker`.
   - UFW firewall is active allowing only ports 22, 80, 443.
   - Docker network `edge` exists: `docker network ls`.
   - `/etc/ssl/cloudflare/origin_pull_ca.pem` is downloaded.

### Step 2.2: Install Cloudflare Origin CA Certificates
1. Copy the Origin CA certificate and private key generated in Step 1.2 to the VPS:
   ```bash
   sudo mkdir -p /etc/ssl/cloudflare
   sudo chmod 700 /etc/ssl/cloudflare
   sudo nano /etc/ssl/cloudflare/origin.crt # paste origin certificate
   sudo nano /etc/ssl/cloudflare/origin.key # paste origin private key
   sudo chmod 600 /etc/ssl/cloudflare/origin.key
   sudo chmod 644 /etc/ssl/cloudflare/origin.crt
   ```

### Step 2.3: Start Edge Reverse Proxy (Caddy 2)
1. Copy `platform/vps/edge/` to `/opt/bexiemart/edge/`:
   ```bash
   sudo mkdir -p /opt/bexiemart/edge
   sudo cp platform/vps/edge/* /opt/bexiemart/edge/
   cd /opt/bexiemart/edge
   docker compose up -d
   ```
2. Check Caddy health:
   ```bash
   docker ps --filter "name=edge-caddy"
   docker logs edge-caddy
   ```

---

## 5. Phase 3: Staging Deployment & Validation

### Step 3.1: Configure Staging Environment File
1. On the VPS, create `/opt/bexiemart/staging/api.env`:
   ```bash
   sudo -u deploy cp deploy/env/api.env.example /opt/bexiemart/staging/api.env
   sudo chmod 600 /opt/bexiemart/staging/api.env
   ```
2. Populate staging values:
   - `APP_ENV=staging`
   - `CORS_ORIGIN=https://staging-admin.bexiemart.com,https://staging.bexiemart.com`
   - `DATABASE_URL=<Neon_bexiemart_staging_connection_string>`
   - `JWT_SECRET=<new_random_64_char_base64>`
   - `ADMIN_JWT_SECRET=<new_random_64_char_base64>`

### Step 3.2: Trigger Staging Deployment
1. Execute deployment gate via deploy script:
   ```bash
   sudo -u deploy /opt/bexiemart/bin/bexiemart-deploy staging <RELEASE_SHA>
   ```
2. Verify smoke test:
   ```bash
   node scripts/smoke.mjs "https://staging-api.bexiemart.com" "<RELEASE_SHA>" "staging"
   ```
3. Verify that:
   - `/api/v1/health` returns HTTP 200 with `environment: "staging"`.
   - Attempting direct HTTP request to origin IP fails TLS handshake (AOP active).
   - Socket.io connects over `wss://staging-api.bexiemart.com`.

---

## 6. Phase 4: Production Cutover & Session Continuity

### Step 4.1: Extract Dynamic Secrets from Render
To prevent mass user session invalidation:
1. Log in to Render Dashboard -> **Services** -> `bexiemart-api` -> **Environment**.
2. Locate the dynamically generated environment variables:
   - `JWT_SECRET`
   * `ADMIN_JWT_SECRET`
3. Copy both values securely into the company password manager.

### Step 4.2: Provision Production Environment on VPS
1. On the VPS, create `/opt/bexiemart/production/api.env`:
   ```bash
   sudo -u deploy cp deploy/env/api.env.example /opt/bexiemart/production/api.env
   sudo chmod 600 /opt/bexiemart/production/api.env
   ```
2. Inject the extracted Render secrets:
   ```bash
   JWT_SECRET=<REPLICATED_RENDER_JWT_SECRET>
   ADMIN_JWT_SECRET=<REPLICATED_RENDER_ADMIN_JWT_SECRET>
   ```
3. Set production connection strings:
   - `APP_ENV=production`
   - `CORS_ORIGIN=https://admin.bexiemart.com,https://bexiemart.com`
   - `DATABASE_URL=<Neon_bexiemart_production_connection_string>`
   - `REDIS_URL=redis://redis:6379`
   - `CLOUDINARY_CLOUD_NAME=<company_cloud_name>`
   - `CLOUDINARY_API_KEY=<company_api_key>`
   - `CLOUDINARY_API_SECRET=<company_api_secret>`
   - `PAYSTACK_LIVE_SECRET_KEY=<company_paystack_live_secret>`
   - `PAYSTACK_LIVE_PUBLIC_KEY=<company_paystack_live_public>`

### Step 4.3: Deploy Production API Container
1. Deploy production at the matching release SHA:
   ```bash
   sudo -u deploy /opt/bexiemart/bin/bexiemart-deploy production <RELEASE_SHA>
   ```
2. Check local health check:
   ```bash
   docker exec -it bexiemart-production-api node -e "fetch('http://127.0.0.1:4000/api/v1/health').then(r => r.json()).then(console.log)"
   ```

### Step 4.4: Update Cloudflare Production DNS Record
1. In Cloudflare DNS -> change record `api.bexiemart.com` to point to `<VPS_IP>` with **Proxied (Orange Cloud) ON**.
2. Run public smoke test:
   ```bash
   node scripts/smoke.mjs "https://api.bexiemart.com" "<RELEASE_SHA>" "production"
   ```

### Step 4.5: Repoint Vercel Production Admin Proxy
1. In Vercel Dashboard -> `bexiemart-admin` -> **Settings** -> **Environment Variables**.
2. In the `Production` environment:
   - Update `API_PROXY_TARGET` from `https://bexiemart-api.onrender.com/api/v1` to `https://api.bexiemart.com/api/v1`.
3. Redeploy production:
   ```bash
   vercel redeploy --prod
   ```
4. Test Admin Sign-In:
   - Open `https://admin.bexiemart.com` (or Vercel production deployment).
   - Log in with admin credentials.
   - Verify cookies are set (`SameSite=Strict, HttpOnly`).
   - Confirm existing session persists without requiring password reset.

### Step 4.6: Publish Mobile OTA Update
1. Update `apps/mobile/eas.json` production profile:
   ```json
   "production": {
     "env": {
       "EXPO_PUBLIC_API_URL": "https://api.bexiemart.com/api/v1"
     },
     "channel": "production"
   }
   ```
2. Publish OTA update to production channel:
   ```bash
   eas update --channel production --message "Production cutover to api.bexiemart.com"
   ```
3. Test physical mobile device with installed app:
   - Open app.
   - Verify previous user token refresh succeeds against `api.bexiemart.com`.
   - Verify listings, cart, orders, and push token registration.

---

## 7. Phase 5: Dual-Run Monitoring & Decommissioning

### 4-Week Dual-Run Window
- Keep the Render `bexiemart-api` service running on its existing SHA for 28 days.
- Legacy mobile app installations that have not downloaded the OTA update will continue communicating with Render.
- Sentry and uptime monitors must track both:
  - VPS origin: `https://api.bexiemart.com/api/v1/health`
  - Render legacy origin: `https://bexiemart-api.onrender.com/api/v1/health`

### Decommissioning Checklist (After Day 28)
- [ ] Inspect Render access logs: verify inbound requests to `bexiemart-api.onrender.com` have dropped below 1 req/hour.
- [ ] Suspend Render web service for 48 hours. Monitor for user support tickets or Sentry errors.
- [ ] Permanently delete Render `bexiemart-api` web service.
- [ ] Remove `render.yaml` and Render deploy step from `.github/workflows/cd.yml`.
- [ ] Remove legacy origins (`*.onrender.com`, `bexiemart-admin-*.vercel.app`) from `CORS_ORIGIN` allowlist in `api.env`.
- [ ] Rotate Neon PostgreSQL production database passwords and update GitHub secret `API_ENV_FILE`.

---

## 8. Rollback & Contingency Procedures

| Failure Scenario | Rollback Trigger | Immediate Action |
|---|---|---|
| **Cloudflare DNS failure** | Email delivery bounces or website errors | Revert nameservers at Hostinger registrar to previous values. |
| **VPS API startup failure** | `bexiemart-deploy` health check times out | `bexiemart-deploy` automatically rolls back container to previous SHA. |
| **Session invalidation storm** | Multiple 401 errors from mobile app users | Verify `JWT_SECRET` in `/opt/bexiemart/production/api.env` matches Render's exact secret string. Re-inject and reload: `docker compose restart api`. |
| **Vercel admin proxy 502/504** | Dashboard cannot reach API | Revert `API_PROXY_TARGET` in Vercel back to `https://bexiemart-api.onrender.com/api/v1` and redeploy. |
| **Mobile app connectivity failure** | Bug in OTA bundle | Publish rollback OTA update via `eas update --channel production` pointing back to Render. |
