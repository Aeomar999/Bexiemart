# Bexiemart — API Remediation Checklist

Based on `API-AUDIT.md` — 130 endpoints, 33 controllers.

---

## P0 — Mobile will 404 (7 items)

- [ ] **P0.1 — Add `POST /orders/:id/cancel`** (`orders.controller.ts`)
  Create endpoint + `OrdersService.cancel()` — check order is cancellable (pending/confirmed only), update status to CANCELLED.

- [ ] **P0.2 — Fix `POST /wallet/cards/verify-save` path mismatch** (`wallet.controller.ts`)
  Either rename server route from `verify` → `verify-save`, or update mobile `wallet.ts:29` from `verify-save` → `verify`. Pick one side.

- [ ] **P0.3 — Create customer `PaymentMethodsController`** (new file)
  New controller at `/payment-methods` with:
  - [ ] `GET /payment-methods` — list saved methods
  - [ ] `POST /payment-methods/card` — save a card
  - [ ] `POST /payment-methods/momo` — save mobile money
  - [ ] `DELETE /payment-methods/:id` — remove a method
  - [ ] `PATCH /payment-methods/:id/default` — set default

- [ ] **P0.4 — Verify all 7 fixes against mobile hooks**
  After fixing, trace each mobile `use-*.ts` hook → API client → server route and confirm no remaining 404s.

---

## P1 — Missing features (7 items)

- [ ] **P1.1 — Create Story module** (new folder `modules/stories/`)
  - [ ] `GET /stories` — list active (non-expired) stories
  - [ ] `POST /stories` — create a story (image/video + expiration)
  - [ ] `DELETE /stories/:id` — delete own story
  - [ ] `POST /stories/:id/view` — track a story view

- [ ] **P1.2 — Add admin dispute endpoints** (`admin.controller.ts`)
  - [ ] `GET /admin/disputes` — list all open disputes
  - [ ] `POST /admin/disputes/:id/resolve` — resolve in favor of buyer or vendor

- [ ] **P1.3 — Add vendor dispute visibility** (`vendor.controller.ts`)
  - [ ] `GET /vendor/disputes` — list disputes on vendor's orders

- [ ] **P1.4 — Add admin dashboard endpoint** (`admin.controller.ts`)
  - [ ] `GET /admin/dashboard` — return key metrics: total orders, revenue, users, vendors, disputes open

- [ ] **P1.5 — Add product search endpoint** (`products.controller.ts`)
  - [ ] `GET /products/search` — full-text search across product name + description

- [ ] **P1.6 — Add featured products endpoint** (`products.controller.ts`)
  - [ ] `GET /products/featured` — return promoted/featured products

---

## P2 — Quality-of-life improvements (5 items)

- [ ] **P2.1 — Serve Swagger UI** (`main.ts`)
  Add `SwaggerModule.setup('api/docs', app, document)` so devs can browse the API at `/api/docs`.

- [ ] **P2.2 — Add pagination metadata to all list endpoints**
  Standardize list response shape: `{ data: T[], meta: { total, page, limit, totalPages } }`. Currently some return the raw array.

- [ ] **P2.3 — Add `@ApiBearerAuth()` + response types to Swagger**
  Many controllers have `@ApiTags` and `@ApiOperation` but are missing `@ApiBearerAuth()`, `@ApiOkResponse()`, and full response DTOs.

- [ ] **P2.4 — Regenerate `swagger.json`**
  Run the build with Swagger plugin to produce an up-to-date OpenAPI spec.

- [ ] **P2.5 — Handle food vs main cart consolidation decision**
  Two independent cart systems exist (main `/cart` + `/food/cart`). Either merge them or document the intentional split.

---

## P3 — Security & hardening (7 items — overlaps with AUDIT-CHECKLIST)

- [ ] **P3.1 — Secure `POST /payments/webhook`** (`payments.service.ts`)
  Implement HMAC SHA-512 signature verification. Reject unauthenticated payloads. See Audit C2.

- [ ] **P3.2 — Add file-type validation to `GET /upload/signature`** (`upload.controller.ts`)
  Whitelist MIME types (image/jpeg, image/png, image/webp, video/mp4). Enforce max size. See Audit H6.

- [ ] **P3.3 — Fix `GET /auth/me` being public** (`auth.controller.ts`)
  Either add `@UseGuards(AuthGuard)` or handle the null `req.user` case gracefully.

- [ ] **P3.4 — Add Prisma transactions to wallet/escrow/payment mutations**
  Wrap all financial writes in `prisma.$transaction()`. See Audit H4.

- [ ] **P3.5 — Add rate-limiting to sensitive endpoints**
  Wallet withdraw/transfer already throttled. Add throttling to payment init, order creation, and admin endpoints. See Audit C3.

- [ ] **P3.6 — Add request validation to all DTOs**
  Missing `class-validator` decorators on most DTOs. See Audit H5.

- [ ] **P3.7 — Add DB indexes for common query patterns**
  Index `(userId, status)` on Order, `(productId, userId)` on Review, `(vendorId)` on Product. See Audit L9.

---

## P4 — Cleanup & backlog (5 items)

- [ ] **P4.1 — Fix vendor onboarding creating dispatcher role** (`vendor.service.ts`)
  Onboarding should not mutate the user's `role` to `dispatcher`. If the user wants to be a dispatcher, they should have a separate flow.

- [ ] **P4.2 — Add admin revenue/user reports** (`admin.controller.ts`)
  `GET /admin/reports/revenue` (daily/weekly/monthly) and `GET /admin/reports/users` (signups, active, churn).

- [ ] **P4.3 — Add `GET /metrics` endpoint**
  Expose Prometheus metrics for production monitoring.

- [ ] **P4.4 — Add API versioning**
  Prefix all routes with `/api/v1/` for future-proofing. See Audit M2.

- [ ] **P4.5 — Add `POST /orders/:id/request-refund` for customers**
  Separate from dispute flow — let customers request a refund before escalating to escrow dispute.

---

## Progress tracker

```
P0 — Mobile 404s:     ░░░░░░░░░░░░░░░░░░░░  0/7
P1 — Missing features: ░░░░░░░░░░░░░░░░░░░░  0/7
P2 — Improvements:     ░░░░░░░░░░░░░░░░░░░░  0/5
P3 — Security:         ░░░░░░░░░░░░░░░░░░░░  0/7
P4 — Backlog:          ░░░░░░░░░░░░░░░░░░░░  0/5
```

**Legend:** `[ ]` = pending, `[x]` = done, `[-]` = skipped/won't fix
