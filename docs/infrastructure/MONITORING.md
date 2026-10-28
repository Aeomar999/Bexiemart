# Observability, Monitoring & Alerting Runbook (SEC-090, SEC-095)

**Status:** Production Standard  
**Applies to:** Bexiemart (API, Admin Dashboard, Mobile App, Edge Proxy, Hostinger VPS)

---

## 1. Observability Architecture

Bexiemart uses a four-pillar observability strategy designed for high signal, low noise, and strict data privacy:

```
      [ Mobile App ]                 [ Admin Web ]                 [ Backend API ]
   (expo + @sentry/rn)            (next.js + @sentry)             (express + @sentry)
            │                              │                               │
            │ (scrubbed)                   │ (/monitoring-tunnel)          │ (scrubbed)
            ▼                              ▼                               ▼
     ┌──────────────┐              ┌──────────────┐                ┌──────────────┐
     │ Sentry Cloud │              │ Next.js Host │                │ Sentry Cloud │
     └──────────────┘              └──────┬───────┘                └──────────────┘
                                          │
                                   ┌──────────────┐
                                   │ Sentry Cloud │
                                   └──────────────┘

      [ Docker Containers ]        [ Host Metrics ]
      (pino-http JSON logs)      (CPU, RAM, Disk, Net)
                │                          │
                └───────────┬──────────────┘
                            ▼
                  [ Vector VPS Agent ]
                (disk buffer + remap)
                            │
                            ▼
                [ Better Stack Logtail ]
               (14-day searchable logs)

      [ Synthetic Uptime Monitors ] ──► [ Better Stack Uptime ] ──► [ On-Call Alerts ]
      (Health, Admin, SSL, Drills)
```

1. **Error Tracking & Performance:** Sentry (`@sentry/node`, `@sentry/nextjs`, `@sentry/react-native`).
2. **Centralized Log Aggregation:** Structured JSON via `pino-http`, collected and shipped by Vector agent on the VPS to Better Stack Logtail.
3. **Synthetic Uptime & Heartbeats:** Better Stack Uptime monitors querying `/api/v1/health` and tracking cron heartbeats.
4. **Database Observability:** Neon metrics and proactive threshold alerts.

---

## 2. Privacy & PII Scrubbing Rules

To comply with data protection regulations (Ghana DPA 2012, GDPR) and prevent security token leakage:

### Mandatory Redaction Rules
- **Authentication Headers:** `Authorization`, `Proxy-Authorization`, `X-API-Key`, and any header containing `token`, `secret`, `cookie`, or `auth` are deleted before transmission.
- **Cookies:** All cookies (`cookie`, `set-cookie`, `session`) are stripped.
- **Request Bodies:** All request body payloads (`event.request.data`) are stripped from Sentry events.
- **User PII:** `email`, `ip_address`, and `username` fields are stripped from user error context. Only the opaque internal database `id` (e.g. `usr_...`) is retained.
- **Access Logs:** Query parameters and body fields named `token`, `code`, `secret`, `password`, `refreshToken`, `currentPassword`, and `newPassword` are censored as `[REDACTED]`.

---

## 3. Sentry Integration Standards

### A. Backend API (`apps/server`)
- **Loader:** Loaded at runtime start via `src/instrument.ts`.
- **Environment & Release:**
  - `environment`: Set from `APP_ENV` (`staging`, `production`, `development`).
  - `release`: Set from `RELEASE_SHA` (Docker build commit).
- **Request Tagging:** All exceptions captured inside the NestJS lifecycle are tagged with `requestId` (matching `X-Request-Id`).
- **5xx Error Masking:** Production responses return generic `Internal server error` while Sentry receives full stack traces, breadcrumbs, and request metadata.

### B. Admin Dashboard (`apps/admin`)
- **CSP Integrity via Tunneling:** Client-side Sentry events are routed through `/monitoring-tunnel` (`tunnelRoute` in `next.config.ts`).
  - **Result:** The Content Security Policy `connect-src 'self'` remains strictly intact without allowing third-party ingestion domains.
- **Source Maps:** Source maps are hidden in public bundles.

### C. Mobile App (`apps/mobile`)
- **Expo Plugin:** Configured via `@sentry/expo` in `app.json`.
- **Environment Resolution:** Environment dynamically matches the active EAS release channel (`Updates.channel || 'development'`).
- **Wrapper:** Root layout wrapped with `Sentry.wrap(RootLayout)`.

---

## 4. Vector Log Shipping (`platform/vps/vector/`)

The Vector daemon runs as a container on the Hostinger VPS:
- **Image:** `timberio/vector:0.45.0-alpine`.
- **Sources:**
  - `docker_logs`: Ingests container stdout/stderr from `bexiemart-.*-api`, `bexiemart-.*-redis`, and `edge-caddy`.
  - `host_metrics`: Collects system load, CPU, RAM, disk, and network I/O every 30 seconds.
- **Remap Transformation:** Parses single-line JSON logs from `pino-http`, extracts `service`, `environment`, `release`, `requestId`, `level`, and `time`.
- **Resilient Buffer:** 512 MB disk buffer prevents log loss during temporary network or upstream outages.
- **Sink:** Authenticated HTTP POST to Better Stack Logtail.

---

## 5. Better Stack Uptime & Heartbeat Monitors

| Monitor Name | Target URL / Trigger | Check Interval | Criteria for OK | Alert Severity |
|---|---|---|---|---|
| **Production API Health** | `https://api.bexiemart.com/api/v1/health` | 30 seconds | HTTP 200, body contains `"status":"ok"` and `"environment":"production"` | **P0** |
| **Staging API Health** | `https://staging-api.bexiemart.com/api/v1/health` | 60 seconds | HTTP 200, body contains `"status":"ok"` and `"environment":"staging"` | **P1** |
| **Admin Dashboard UI** | `https://admin.bexiemart.com` | 60 seconds | HTTP 200, response time < 2000ms | **P1** |
| **Edge SSL Certificates** | All public hostnames | Daily | Expiry > 21 days remaining | **P2** |
| **Domain Registration** | `bexiemart.com` | Daily | Expiry > 30 days remaining | **P2** |
| **Nightly Backup Heartbeat** | Ping from `/opt/bexiemart/bin/bexiemart-backup` | Every 24 hours | Heartbeat received within 26 hours | **P1** |
| **Monthly Disaster Drill** | Ping from `.github/workflows/restore-drill.yml` | Every 30 days | Heartbeat received within 32 days | **P2** |

---

## 6. Neon PostgreSQL Threshold Alerts

Neon alert policies configured in the `bexiemart-production` project:
1. **Connections:** Alert when open connections exceed 80% of cluster limit.
2. **Storage Utilization:** Alert when storage exceeds 75% capacity.
3. **Backup:** Alert immediately if continuous snapshot creation fails.

---

## 7. Incident Escalation & Response Matrix

| Severity | Definition | Notification Channels | Response Target (SLA) | On-Call Action |
|---|---|---|---|---|
| **P0 (Critical Outage)** | Production API down, DB down, or user-facing service returning 5xx site-wide. | SMS, Phone Call (Better Stack), Slack `#alerts-critical` | **15 minutes** | 1. Check `/api/v1/health`.<br>2. Rollback to previous SHA via `workflow_dispatch` (< 5 min).<br>3. Inspect container logs with `docker logs --tail 100 bexiemart-production-api`. |
| **P1 (Degraded Service)** | Staging API down, Admin dashboard degraded, or Nightly backup missed. | Slack `#alerts-critical`, Email | **1 hour** | 1. Review Sentry for top recurring exceptions.<br>2. Check Vector host metrics for CPU/RAM exhaustion.<br>3. Verify database connectivity. |
| **P2 (Maintenance Warning)** | SSL cert expiring in < 30 days, disk space > 70%, or dependency alert. | Slack `#devops`, Email | **24 hours** | 1. Renew/verify Cloudflare Origin CA certificate.<br>2. Run Docker prune on VPS (`docker system prune -af`). |

---

## 8. Verification & Drill Commands

### A. Verifying Request ID Tagging & Error Tracking
To verify that an unhandled 5xx error is properly captured and tagged:
```bash
# 1. Send test request to an endpoint with custom request ID
curl -i -H "X-Request-Id: test-trace-888" https://staging-api.bexiemart.com/api/v1/auth/me

# 2. Inspect response header:
# X-Request-Id: test-trace-888

# 3. In Sentry dashboard:
# Filter issues by tag: `requestId:test-trace-888`
# Verify no Cookie or Authorization header exists in the captured event.
```

### B. Verifying Structured Access Logging
On the Hostinger VPS:
```bash
# Inspect real-time JSON logs emitted by pino-http
docker compose -p bexiemart-staging logs --tail 20 -f api | jq .

# Verify required fields exist:
# { "service": "bexiemart-backend", "environment": "staging", "release": "...", "requestId": "..." }
```

### C. Verifying Vector Shipping Status
```bash
# Check Vector agent status and sink delivery
docker compose -f /opt/platform/vector/compose.yml logs --tail 50 vector
```
