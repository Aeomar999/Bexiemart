# Disaster Recovery Runbook & Playbook (SEC-089)

**Bexiemart Platform**  
**Document:** `docs/infrastructure/DISASTER_RECOVERY.md`  
**Document Classification:** Confidential — Internal Operational Runbook  
**RTO Objective:** 4 Hours  
**RPO Objective:** 24 Hours  

---

## 1. Executive Summary & Recovery Objectives

This document establishes the official Disaster Recovery (DR) procedures for the Bexiemart application platform.

A disaster is defined as an event causing catastrophic loss or prolonged unavailability of platform services, including:
- Total loss of the primary host (Hostinger VPS termination or hardware failure)
- Database corruption or inadvertent bulk deletion across Neon PostgreSQL clusters
- Loss or compromise of third-party SaaS providers (Cloudinary, Cloudflare, GitHub, Vercel)
- Compromise of server credentials or root signing certificates

### Platform Targets
- **Recovery Point Objective (RPO):** Maximum 24 hours of data loss (nightly automated encrypted backups).
- **Recovery Time Objective (RTO):** Maximum 4 hours to return the platform to full operational service from cold failure.

---

## 2. The Seven Recovery Questions Across All Platform Assets

| Asset | 1. What is Backed Up | 2. Frequency | 3. Retention Period | 4. Where Stored | 5. Who Can Restore | 6. Recovery Procedure | 7. Expected Recovery Time |
|---|---|---|---|---|---|---|---|
| **PostgreSQL Database** | All tables, indexes, functions | Nightly at 02:00 UTC + automated monthly archive | 35 daily snapshots, 12 monthly archives | Cloudflare R2 bucket (`bexiemart-backups`) encrypted via `age` (public key on VPS, private key in password manager) + Neon managed snapshots | DevOps Engineer, DBA, IT Administrator | Section 3.1 below (`deploy/bin/bexiemart-restore`) | RTO: 30–60 min<br>RPO: < 24 h |
| **Cloudinary Media** | Product images, profile pictures, receipts | Continuous (managed multi-region SaaS storage) | Indefinite until GDPR erasure | Multi-cloud Cloudinary storage across AWS/GCP regions | DevOps Engineer | Re-bind credentials or replay user re-uploads | RTO: 15 min<br>RPO: 0 h |
| **Configuration & Secrets** | Production `api.env` files, JWT secrets, third-party API keys | On modification (persisted in GitHub Environments & Password Manager) | Indefinite version history in GitHub Environment audit log | Company Password Manager (Bitwarden/1Password) + GitHub Environment `production` | IT Administrator, Lead Engineer | Section 3.4 below | RTO: 10 min<br>RPO: 0 h |
| **VPS Host Infrastructure** | Ubuntu 24.04 OS, Docker, Caddy edge proxy, systemd units | Version-controlled as code in `platform/vps/` | Git commit history | GitHub repository (`Aeomar999/Bexiemart`) | DevOps Engineer, IT Administrator | Section 3.2 below (`platform/vps/bootstrap.sh`) | RTO: 30–45 min<br>RPO: 0 h |
| **Code & Documentation** | Git repository history, runbooks, schemas, tests | Continuous on every push to `main` | Indefinite git history | GitHub + local clones of active maintainers | DevOps Engineer, Backend Lead | Restore from local git clone or push to new remote | RTO: 15 min<br>RPO: 0 h |

---

## 3. Step-by-Step Restoration Runbooks

### 3.1 PostgreSQL Database Disaster Recovery

#### Scenario A: Restore from Encrypted Off-Site Backup (Cloudflare R2)

When Neon cluster or data is corrupted, use the asymmetric encrypted archive stored in Cloudflare R2:

1. **Retrieve the `age` Identity Key:**
   Fetch the private decryption key (`AGE-SECRET-KEY-1...`) from the Company Password Manager (stored under `Infra/Bexiemart/Backups/Age_Private_Key`).
   Save it to a secure, temporary file on the recovery machine:
   ```bash
   install -m 600 /dev/null /tmp/bexiemart-age-identity.txt
   echo "AGE-SECRET-KEY-1..." > /tmp/bexiemart-age-identity.txt
   ```

2. **Locate the Latest Backup in Cloudflare R2:**
   ```bash
   aws s3 ls s3://bexiemart-backups/daily/ --endpoint-url "$R2_ENDPOINT_URL" | sort | tail -n 1
   ```

3. **Restore into Target Database:**
   > [!WARNING]
   > Direct restoration to production requires the explicit safety flag `--i-understand-this-overwrites-production`.

   To restore into a fresh recovery cluster or isolated staging environment:
   ```bash
   deploy/bin/bexiemart-restore \
     --archive "s3://bexiemart-backups/daily/bexiemart-production-YYYYMMDDTHHMMSSZ.archive.gz.age" \
     --identity /tmp/bexiemart-age-identity.txt \
     --target-uri "postgresql://admin:pass@recovery-cluster.neon.tech/bexiemart"
   ```

   To overwrite a corrupted production cluster:
   ```bash
   deploy/bin/bexiemart-restore \
     --archive "s3://bexiemart-backups/daily/bexiemart-production-YYYYMMDDTHHMMSSZ.archive.gz.age" \
     --identity /tmp/bexiemart-age-identity.txt \
     --target-uri "postgresql://admin:pass@production-cluster.neon.tech/bexiemart" \
     --i-understand-this-overwrites-production
   ```

4. **Verify Restored Database Integrity:**
   Run the automated restore verification script to validate tables, row counts, and record timestamps:
   ```bash
   node apps/server/scripts/verify-restore.js \
     --uri "postgresql://admin:pass@production-cluster.neon.tech/bexiemart" \
     --max-age-hours 26 \
     --min-users 1 \
     --min-products 1
   ```

5. **Clean Up Identity Key:**
   ```bash
   rm -f /tmp/bexiemart-age-identity.txt
   ```

#### Scenario B: Restore from Neon Point-In-Time Snapshot
1. Log into the Neon Console.
2. Select the `bexiemart-production` project -> **Branches** -> **Restore**.
3. Select the desired restore point -> Click **Restore to a New Branch** (recommended to verify before repointing DNS).
4. Once complete, copy the connection string and update `DATABASE_URL` in the GitHub Environment `production`.

---

### 3.2 Total VPS Loss & Rebuild Procedure

When the Hostinger VPS is destroyed or irrecoverable:

1. **Order or Re-provision Ubuntu 24.04 VPS on Hostinger:**
   - Hostinger Console -> Deploy VPS (KVM 2: 2 vCPU, 8 GB RAM, Ubuntu 24.04).
   - Set VPS hostname to `vps.bexiemart.com`.
   - Record the new public IPv4 address (`$NEW_VPS_IP`).

2. **Bootstrap VPS with Baseline Infrastructure:**
   Log into the new VPS as `root`:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/Aeomar999/Bexiemart/main/platform/vps/bootstrap.sh | bash
   ```
   This automatically provisions:
   - Docker CE & compose plugin
   - Security hardening: SSH key-only access, fail2ban, unattended security upgrades
   - Restricted `deploy` system user
   - Edge reverse proxy Docker network (`edge`)
   - Directory hierarchy under `/opt/bexiemart/`

3. **Install Edge TLS Certificates:**
   Copy Cloudflare Origin CA certificate and private key:
   ```bash
   scp origin.crt root@$NEW_VPS_IP:/etc/ssl/cloudflare/origin.crt
   scp origin.key root@$NEW_VPS_IP:/etc/ssl/cloudflare/origin.key
   ssh root@$NEW_VPS_IP "chmod 600 /etc/ssl/cloudflare/origin.key"
   ```

4. **Install Deployment Scripts & Compose Configuration:**
   ```bash
   git clone https://github.com/Aeomar999/Bexiemart.git /tmp/bexiemart-repo
   cp /tmp/bexiemart-repo/deploy/bin/bexiemart-* /opt/bexiemart/bin/
   chmod 755 /opt/bexiemart/bin/bexiemart-*
   cp /tmp/bexiemart-repo/deploy/compose.yml /opt/bexiemart/deploy/compose.yml
   cp -r /tmp/bexiemart-repo/platform/vps/edge /opt/platform/
   cp /tmp/bexiemart-repo/platform/vps/systemd/bexiemart-backup-production.* /etc/systemd/system/
   systemctl daemon-reload && systemctl enable --now bexiemart-backup-production.timer
   rm -rf /tmp/bexiemart-repo
   ```

5. **Launch Edge Reverse Proxy (Caddy):**
   ```bash
   docker compose -f /opt/platform/edge/compose.yml up -d
   ```

6. **Deploy Production API Container:**
   Retrieve `API_ENV_FILE` from the Password Manager / GitHub Environment `production` and save to `/opt/bexiemart/production/api.env` (chmod 600, owner `deploy`).
   Deploy the latest release:
   ```bash
   su - deploy -c "/opt/bexiemart/bin/bexiemart-deploy deploy production <LATEST_RELEASE_SHA>"
   ```

7. **Update Cloudflare DNS:**
   In Cloudflare DNS management, update the `A` record for:
   - `api.bexiemart.com` -> `$NEW_VPS_IP`
   - `staging-api.bexiemart.com` -> `$NEW_VPS_IP`
   Ensure proxy status is set to **Proxied (Orange Cloud)**.

---

### 3.3 Configuration and Secrets Recovery
1. If GitHub repository secrets are lost, open the Company Password Manager.
2. Locate folder `Infra / Environments / Production`.
3. Copy the canonical environment block and paste into GitHub Environment `production` as `API_ENV_FILE`.
4. Re-run deployment workflow from GitHub Actions.

---

## 4. Disaster Recovery Testing & Verification

### 4.1 Automated Monthly Restore Drill
- Runs automatically on the 1st of every month via GitHub Actions (`.github/workflows/restore-drill.yml`).
- Decrypts the latest daily backup from Cloudflare R2 into an isolated ephemeral `postgres:16` container.
- Executes `verify-restore.js` testing schema integrity, table non-emptiness, and timestamp freshness (< 26 h).
- Pings Better Stack Heartbeat on completion. If a monthly drill does not succeed, an on-call alert is raised automatically.

### 4.2 Annual Cold-Site Simulation
- Once per calendar year, the DevOps lead provisions a disposable VPS in an alternative cloud region (e.g., Hetzner or DigitalOcean).
- Executes the full recovery playbook from cold start using only passwords and keys stored in the company password manager.
- Verifies that RTO is under 4 hours and documents lessons learned.
