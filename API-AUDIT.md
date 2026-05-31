# Bexiemart — Full API Audit

**Date:** 2026-05-31  
**Base URL:** `/api` (global prefix set in `main.ts`)  
**Total controllers:** 33 files  
**Total HTTP endpoints:** 130  

---

## 1. Complete Endpoint Inventory

### 1.1 Auth (`/auth`) — 5 endpoints
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| POST | `/auth/register` | Throttle(5/min) | ✅ | Public |
| POST | `/auth/login` | Throttle(10/min) | ✅ | Public |
| GET | `/auth/me` | — | ✅ | Public — returns current user via token |
| POST | `/auth/forgot-password` | Throttle(3/min) | ✅ | Public |
| POST | `/auth/reset-password` | Throttle(3/min) | ✅ | Public |

### 1.2 Health (`/health`) — 1 endpoint
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| GET | `/health` | — | ✅ | No auth, returns DB/memory/uptime |

### 1.3 Users (`/users`) — 2 endpoints
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| GET | `/users/me` | AuthGuard | ✅ | |
| PATCH | `/users/profile` | AuthGuard | ✅ | |

### 1.4 Admin (`/admin`) — 11 endpoints
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| GET | `/admin/users` | AuthGuard + AdminGuard | ✅ | |
| GET | `/admin/users/:id` | AuthGuard + AdminGuard | ✅ | |
| PATCH | `/admin/users/:id/role` | AuthGuard + AdminGuard | ✅ | |
| GET | `/admin/vendors` | AuthGuard + AdminGuard | ✅ | |
| PATCH | `/admin/vendors/:id/approve` | AuthGuard + AdminGuard | ✅ | |
| PATCH | `/admin/vendors/:id/suspend` | AuthGuard + AdminGuard | ✅ | |
| GET | `/admin/config` | AuthGuard + AdminGuard | ✅ | |
| PUT | `/admin/config` | AuthGuard + AdminGuard | ✅ | |
| GET | `/admin/orders` | AuthGuard + AdminGuard | ✅ | |
| GET | `/admin/orders/:id` | AuthGuard + AdminGuard | ✅ | |
| PATCH | `/admin/orders/:id/status` | AuthGuard + AdminGuard | ✅ | |

### 1.5 Products (`/products`) — 4 endpoints
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| GET | `/products` | AuthGuard | ✅ | Params: category, search, vendorId, page, limit |
| GET | `/products/categories` | AuthGuard | ✅ | |
| GET | `/products/:id` | AuthGuard | ✅ | |
| GET | `/products/store/:id` | AuthGuard | ✅ | |

### 1.6 Cart (`/cart`) — 4 endpoints
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| GET | `/cart` | AuthGuard | ✅ | |
| POST | `/cart` | AuthGuard | ✅ | |
| PUT | `/cart/:id` | AuthGuard | ✅ | |
| DELETE | `/cart/:id` | AuthGuard | ✅ | |

### 1.7 Orders (`/orders`) — 3 endpoints
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| POST | `/orders` | AuthGuard | ✅ | |
| GET | `/orders` | AuthGuard | ✅ | Paginated |
| GET | `/orders/:id` | AuthGuard | ✅ | |
| **POST** | **`/orders/:id/cancel`** | — | **❌ MISSING** | Mobile calls this but server has no route |

### 1.8 Payments (`/payments`) — 4 endpoints
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| POST | `/payments/initialize` | AuthGuard | ✅ | |
| GET | `/payments/verify/:reference` | AuthGuard | ✅ | |
| POST | `/payments/webhook` | — | ⚠️ | **CRITICAL:** No auth, no signature verification |
| POST | `/payments/charge-card` | AuthGuard | ✅ | |

### 1.9 Wallet (`/wallet`) — 22 endpoints
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| GET | `/wallet` | AuthGuard | ✅ | |
| GET | `/wallet/transactions` | AuthGuard | ✅ | |
| POST | `/wallet/topup/initialize` | AuthGuard | ✅ | |
| GET | `/wallet/topup/verify/:reference` | AuthGuard | ✅ | |
| POST | `/wallet/withdraw` | AuthGuard + Throttle(5/min) | ✅ | |
| POST | `/wallet/transfer` | AuthGuard + Throttle(5/min) | ✅ | |
| POST | `/wallet/pin` | AuthGuard | ✅ | |
| POST | `/wallet/pin/change` | AuthGuard | ✅ | |
| POST | `/wallet/pin/verify` | AuthGuard | ✅ | |
| POST | `/wallet/pin/reset` | AuthGuard | ✅ | |
| GET | `/wallet/pin/status` | AuthGuard | ✅ | |
| GET | `/wallet/cards` | AuthGuard | ✅ | |
| POST | `/wallet/cards` | AuthGuard | ✅ | |
| PUT | `/wallet/cards/:id` | AuthGuard | ✅ | |
| DELETE | `/wallet/cards/:id` | AuthGuard | ✅ | |
| POST | `/wallet/cards/:id/default` | AuthGuard | ✅ | |
| GET | `/wallet/bank-accounts` | AuthGuard | ✅ | |
| POST | `/wallet/bank-accounts` | AuthGuard | ✅ | |
| DELETE | `/wallet/bank-accounts/:id` | AuthGuard | ✅ | |
| GET | `/wallet/resolve-account` | AuthGuard | ✅ | |
| GET | `/wallet/momo-accounts` | AuthGuard | ✅ | |
| POST | `/wallet/momo-accounts` | AuthGuard | ✅ | |
| DELETE | `/wallet/momo-accounts/:id` | AuthGuard | ✅ | |
| POST | `/wallet/cards/verify` | AuthGuard | ✅ | **PATH MISMATCH:** Mobile calls `verify-save` not `verify` |

### 1.10 Escrow (`/escrow`) — 5 endpoints
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| GET | `/escrow` | AuthGuard | ✅ | |
| GET | `/escrow/:id` | AuthGuard | ✅ | |
| POST | `/escrow/:id/dispute` | AuthGuard | ✅ | |
| POST | `/escrow/:id/release` | AuthGuard | ✅ | |
| POST | `/escrow/:id/refund` | AuthGuard | ✅ | |

### 1.11 Addresses (`/addresses`) — 5 endpoints
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| GET | `/addresses` | AuthGuard | ✅ | |
| POST | `/addresses` | AuthGuard | ✅ | |
| PUT | `/addresses/:id` | AuthGuard | ✅ | |
| DELETE | `/addresses/:id` | AuthGuard | ✅ | |
| PATCH | `/addresses/:id/default` | AuthGuard | ✅ | |

### 1.12 Wishlist (`/wishlist`) — 2 endpoints
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| GET | `/wishlist` | AuthGuard | ✅ | |
| POST | `/wishlist/:productId/toggle` | AuthGuard | ✅ | |

### 1.13 Reviews (`/reviews`) — 4 endpoints
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| POST | `/reviews` | AuthGuard | ✅ | |
| GET | `/reviews/product/:productId` | — | ✅ | Public |
| GET | `/reviews/product/:productId/stats` | — | ✅ | Public |
| DELETE | `/reviews/:id` | AuthGuard | ✅ | |

### 1.14 Coupons (`/coupons`) — 1 endpoint
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| POST | `/coupons/validate` | AuthGuard + Throttle(5/min) | ✅ | |

### 1.15 Notifications (`/notifications`) — 4 endpoints
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| GET | `/notifications` | AuthGuard | ✅ | |
| GET | `/notifications/unread-count` | AuthGuard | ✅ | |
| POST | `/notifications/:id/read` | AuthGuard | ✅ | |
| POST | `/notifications/read-all` | AuthGuard | ✅ | |

### 1.16 Upload (`/upload`) — 2 endpoints
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| GET | `/upload/signature` | AuthGuard | ✅ | No file-type validation |
| POST | `/upload` | AuthGuard | ✅ | |

### 1.17 Chat (`/chat`) — 6 HTTP + 7 WebSocket events
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| GET | `/chat/presence` | AuthGuard | ✅ | |
| GET | `/chat/conversations` | AuthGuard | ✅ | |
| GET | `/chat/conversations/:id` | AuthGuard | ✅ | |
| POST | `/chat/conversations` | AuthGuard | ✅ | |
| POST | `/chat/conversations/:id/read` | AuthGuard | ✅ | |
| GET | `/chat/conversations/:id/messages` | AuthGuard | ✅ | |
| WS | `chat` namespace | — | ✅ | 7 events: presence sub/unsub, join/leave conv, send_msg, read, typing |

### 1.18 Vendor (`/vendor`) — 17 endpoints
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| GET | `/vendor/profile` | AuthGuard | ✅ | |
| POST | `/vendor/onboarding` | AuthGuard | ✅ | |
| GET | `/vendor/stats` | AuthGuard | ✅ | |
| GET | `/vendor/products` | AuthGuard | ✅ | |
| POST | `/vendor/products` | AuthGuard | ✅ | |
| PUT | `/vendor/products/:id` | AuthGuard | ✅ | |
| DELETE | `/vendor/products/:id` | AuthGuard | ✅ | |
| GET | `/vendor/orders` | AuthGuard | ✅ | |
| GET | `/vendor/orders/:id` | AuthGuard | ✅ | |
| PATCH | `/vendor/orders/:id/status` | AuthGuard | ✅ | |
| GET | `/vendor/earnings` | AuthGuard | ✅ | |
| GET | `/vendor/earnings/transactions` | AuthGuard | ✅ | |
| GET | `/vendor/earnings/analytics` | AuthGuard | ✅ | |
| POST | `/vendor/earnings/withdraw` | AuthGuard | ✅ | |
| PATCH | `/vendor/shop` | AuthGuard | ✅ | |
| GET | `/vendor/services` | AuthGuard | ✅ | See §1.19 |
| GET | `/vendor/services/:id` | AuthGuard | ✅ | |
| POST | `/vendor/services` | AuthGuard | ✅ | |
| PUT | `/vendor/services/:id` | AuthGuard | ✅ | |
| DELETE | `/vendor/services/:id` | AuthGuard | ✅ | |
| GET | `/vendor/reels` | AuthGuard | ✅ | See §1.20 |
| GET | `/vendor/reels/:id` | AuthGuard | ✅ | |
| POST | `/vendor/reels` | AuthGuard | ✅ | |
| PUT | `/vendor/reels/:id` | AuthGuard | ✅ | |
| DELETE | `/vendor/reels/:id` | AuthGuard | ✅ | |

### 1.19 Vendor Sub-Modules
| Prefix | Endpoints | Guards | Works? |
|--------|-----------|--------|--------|
| `/vendor/staff` | GET, POST, PUT, DELETE, PATCH toggle (5) | AuthGuard | ✅ |
| `/vendor/reviews` | GET list, POST reply (2) | AuthGuard | ✅ |
| `/vendor/payment-methods` | GET, POST bank, POST momo, DELETE, PATCH default (6) | AuthGuard | ✅ |
| `/vendor/hours` | GET, PUT (2) | AuthGuard | ✅ |
| `/vendor/documents` | GET, POST, DELETE (3) | AuthGuard | ✅ |
| `/vendor/customers` | GET list, GET detail (2) | AuthGuard | ✅ |
| `/vendor/coupons` | GET, POST, PUT, DELETE, PATCH toggle (5) | AuthGuard | ✅ |

### 1.20 Food (`/food`) — 12 endpoints
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| GET | `/food/restaurants` | AuthGuard | ✅ | |
| GET | `/food/restaurants/:id` | AuthGuard | ✅ | |
| GET | `/food/items` | AuthGuard | ✅ | |
| POST | `/food/cart/add` | AuthGuard | ✅ | |
| GET | `/food/cart` | AuthGuard | ✅ | |
| PUT | `/food/cart/item/:id` | AuthGuard | ✅ | |
| DELETE | `/food/cart/item/:id` | AuthGuard | ✅ | |
| DELETE | `/food/cart` | AuthGuard | ✅ | |
| POST | `/food/checkout` | AuthGuard | ✅ | |
| GET | `/food/orders` | AuthGuard | ✅ | |
| GET | `/food/orders/:id` | AuthGuard | ✅ | |

### 1.21 Dispatcher (`/dispatcher`) — 12 endpoints
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| GET | `/dispatcher/profile` | AuthGuard | ✅ | |
| POST | `/dispatcher/profile` | AuthGuard | ✅ | |
| PUT | `/dispatcher/status` | AuthGuard | ✅ | |
| PUT | `/dispatcher/location` | AuthGuard | ✅ | No location bounds validation |
| GET | `/dispatcher/tasks/available` | AuthGuard | ✅ | |
| GET | `/dispatcher/tasks` | AuthGuard | ✅ | |
| POST | `/dispatcher/tasks/:id/accept` | AuthGuard | ✅ | |
| PUT | `/dispatcher/tasks/:id/status` | AuthGuard | ✅ | |
| GET | `/dispatcher/earnings` | AuthGuard | ✅ | |
| GET | `/dispatcher/earnings/transactions` | AuthGuard | ✅ | |
| GET | `/dispatcher/earnings/analytics` | AuthGuard | ✅ | |
| POST | `/dispatcher/earnings/withdraw` | AuthGuard | ✅ | |

### 1.22 Customer Services (`/services`) — 5 endpoints
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| GET | `/services` | AuthGuard | ✅ | |
| GET | `/services/:id` | AuthGuard | ✅ | |
| POST | `/services/:id/book` | AuthGuard | ✅ | |
| GET | `/services/bookings` | AuthGuard | ✅ | |
| DELETE | `/services/bookings/:id` | AuthGuard | ✅ | |

### 1.23 Customer Reels (`/reels`) — 4 endpoints
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| GET | `/reels` | AuthGuard | ✅ | |
| POST | `/reels/:id/like` | AuthGuard | ✅ | |
| POST | `/reels/:id/view` | AuthGuard | ✅ | |
| GET | `/reels/following` | AuthGuard | ✅ | |

### 1.24 Referrals (`/referrals`) — 4 endpoints
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| POST | `/referrals/generate` | AuthGuard | ✅ | |
| GET | `/referrals` | AuthGuard | ✅ | |
| POST | `/referrals/apply` | AuthGuard | ✅ | |
| GET | `/referrals/stats` | AuthGuard | ✅ | |

### 1.25 Flash Sales (`/flash-sales`) — 1 endpoint
| Method | Path | Guards | Works? | Notes |
|--------|------|--------|--------|-------|
| GET | `/flash-sales/active` | AuthGuard | ✅ | No scheduler — relies on query-time date checks |

---

## 2. Summary Statistics

| Metric | Count |
|--------|-------|
| **Controller files** | 33 |
| **Total HTTP endpoints** | 130 |
| **Working endpoints** | 121 |
| **Broken/mismatched endpoints** | 2 |
| **Completely missing endpoints** | 6 (payment-methods CRUD) |
| **Missing features (no endpoints at all)** | 2 models (Story, StoryView) |
| **Endpoints with AuthGuard** | 121 (93%) |
| **Public endpoints** | 8 (auth routes, reviews stats, health) |
| **Admin endpoints** | 11 |
| **WebSocket events** | 7 |

---

## 3. Endpoints That DON'T Work (Broken/Missing)

### ❌ CRITICAL — mobile calls but server has no route

| # | HTTP | Path | Impact | Root Cause |
|---|------|------|--------|------------|
| 1 | POST | `/orders/:id/cancel` | Mobile "Cancel Order" button returns 404 | `orders.controller.ts` has only POST, GET /, GET /:id — no cancel endpoint |
| 2 | GET | `/payment-methods` | Payment methods screen shows nothing | No controller exists for customer payment methods anywhere |
| 3 | POST | `/payment-methods/card` | "Add Card" button fails with 404 | Same — no controller |
| 4 | POST | `/payment-methods/momo` | "Add MoMo" button fails with 404 | Same — no controller |
| 5 | DELETE | `/payment-methods/:id` | "Remove" button fails with 404 | Same — no controller |
| 6 | PATCH | `/payment-methods/:id/default` | "Set Default" fails with 404 | Same — no controller |

### ⚠️ PATH MISMATCH — works but hits the wrong route

| # | Mobile calls | Server has | Result |
|---|-------------|------------|--------|
| 7 | `POST /wallet/cards/verify-save` | `POST /wallet/cards/verify` | 404 unless the path is corrected on one side |

### 🚨 CRITICAL SECURITY — endpoint exists but is broken by design

| # | HTTP | Path | Issue |
|---|------|------|-------|
| 8 | POST | `/payments/webhook` | **No authentication, no signature verification** — any attacker can POST fake payment confirmations. The `x-paystack-signature` header is fetched in the controller but never validated in the service. |

---

## 4. Prisma Models With No API Endpoints

| Model | Expected Endpoints | Status |
|-------|-------------------|--------|
| **Story** | `GET /stories`, `POST /stories`, `DELETE /stories/:id`, `POST /stories/:id/view` | ❌ No controller exists |
| **StoryView** | Should be tracked alongside story views | ❌ No controller exists |

---

## 5. Endpoints That Work But Need Attention

| # | Path | Issue |
|---|------|-------|
| 1 | `GET /upload/signature` | No file-type whitelist or size limit — anyone with a token can upload anything |
| 2 | `GET /auth/me` | Public (no AuthGuard) — works but unusual; the handler calls `req.user` which is null without a guard |
| 3 | `PATCH /admin/users/:id/role` | Role is a single-field enum — changing role discards the previous role entirely |
| 4 | `POST /vendor/onboarding` | Creates a Vendor record but ALSO mutates the user's role to `dispatcher` — overwrites customer/vendor role |
| 5 | All wallet/escrow/payment endpoints | No Prisma `$transaction` — concurrent requests risk double-spending |
| 6 | All food endpoints | Food has its own cart system separate from the main cart — two completely independent cart systems |
| 7 | `POST /payments/charge-card` | Relies on Paystack `authorization_code` from previous transactions — no card-save flow exposed to customers |
| 8 | `GET /flash-sales/active` | Pulls sales where `startDate <= now AND endDate >= now` — no scheduling queue, no auto-activation/deactivation |

---

## 6. APIs That Exist on the Server But No Mobile Screen Calls Them

These API endpoints are fully implemented server-side but the mobile app has no hook or screen that calls them:

| Endpoint | Module | Mobile Usage? |
|----------|--------|---------------|
| `POST /payments/charge-card` | Payments | No mobile UI for saved-card charging |
| `POST /wallet/withdraw` | Wallet | Hook exists but may lack a screen |
| `POST /wallet/transfer` | Wallet | Hook exists |
| `GET /wallet/resolve-account` | Wallet | Hook exists |
| `POST /referrals/generate` | Referrals | May not be surfaced in UI |
| `POST /referrals/apply` | Referrals | May not be surfaced |
| `GET /referrals/stats` | Referrals | Hook exists |
| `POST /dispatcher/tasks/available` | Dispatcher | Behind dispatcher role gate |
| `POST /escrow/:id/dispute` | Escrow | Hook exists |
| `POST /escrow/:id/release` | Escrow | Hook exists |
| `POST /escrow/:id/refund` | Escrow | Hook exists |

---

## 7. Endpoints That Should Exist But Don't

### 7.1 Missing for a complete marketplace

| Endpoint | Reason |
|----------|--------|
| `PATCH /orders/:id/cancel` | Users need to cancel orders |
| `GET /payment-methods` | Need customer payment method management |
| `POST /payment-methods/card` | Adding saved cards |
| `POST /payment-methods/momo` | Adding saved mobile money |
| `DELETE /payment-methods/:id` | Removing payment methods |
| `PATCH /payment-methods/:id/default` | Setting default payment method |
| `GET /stories` | Story feature is in the schema but no API |
| `POST /stories` | Create a story |
| `DELETE /stories/:id` | Delete a story |
| `POST /stories/:id/view` | Track story views |
| `GET /admin/dashboard` | Admin analytics dashboard (stats, revenue, user growth) |
| `GET /admin/disputes` | Admin needs to review open disputes |
| `POST /admin/disputes/:id/resolve` | Admin resolution of disputes |
| `GET /admin/reports/revenue` | Revenue reports |
| `GET /admin/reports/users` | User growth reports |
| `GET /vendor/disputes` | Vendor needs to see disputes on their orders |
| `GET /products/featured` | Featured/promoted products |
| `GET /products/search` | Dedicated search endpoint with full-text |

### 7.2 Missing operational endpoints

| Endpoint | Reason |
|----------|--------|
| `GET /health` | Already exists — good |
| `GET /api` or `GET /api/docs` | Swagger UI not served at a live endpoint |
| `GET /metrics` | Prometheus metrics for monitoring |

---

## 8. Mobile ↔ Server API Mapping

### Fully matched (mobile hook ↔ server endpoint):

| Mobile Hook File | Server Controller | Match? |
|-----------------|-------------------|--------|
| `use-auth.ts` | `auth.controller.ts` | ✅ |
| `use-users.ts` | `users.controller.ts` | ✅ |
| `use-products.ts` | `products.controller.ts` | ✅ |
| `use-cart.ts` | `cart.controller.ts` | ✅ |
| `use-addresses.ts` | `addresses.controller.ts` | ✅ |
| `use-wishlist.ts` | `wishlist.controller.ts` | ✅ |
| `use-reviews.ts` | `reviews.controller.ts` | ✅ |
| `use-notifications.ts` | `notifications.controller.ts` | ✅ |
| `use-upload.ts` | `upload.controller.ts` | ✅ |
| `use-chat.ts` | `chat.controller.ts` + `chat.gateway.ts` | ✅ |
| `use-vendor.ts` | `vendor.controller.ts` | ✅ |
| `use-vendor-services.ts` | `services.controller.ts` (vendor) | ✅ |
| `use-vendor-reels.ts` | `reels.controller.ts` (vendor) | ✅ |
| `use-vendor-staff.ts` | `vendor-staff.controller.ts` | ✅ |
| `use-vendor-reviews.ts` | `vendor-reviews.controller.ts` | ✅ |
| `use-vendor-payment-methods.ts` | `vendor-payment-methods.controller.ts` | ✅ |
| `use-vendor-hours.ts` | `vendor-hours.controller.ts` | ✅ |
| `use-vendor-documents.ts` | `vendor-documents.controller.ts` | ✅ |
| `use-vendor-customers.ts` | `vendor-customers.controller.ts` | ✅ |
| `use-vendor-coupons.ts` | `vendor-coupons.controller.ts` | ✅ |
| `use-admin.ts` | `admin.controller.ts` | ✅ |
| `use-food.ts` | `food.controller.ts` | ✅ |
| `use-wallet.ts` | `wallet.controller.ts` | ⚠️ 1 path mismatch (verify vs verify-save) |
| `use-dispatcher.ts` | `dispatcher.controller.ts` | ✅ |
| `use-services.ts` | `customer-services.controller.ts` | ✅ |
| `use-reels.ts` | `customer-reels.controller.ts` | ✅ |
| `use-referrals.ts` | `referrals.controller.ts` | ✅ |
| `use-flash-sales.ts` | `flash-sales.controller.ts` | ✅ |
| `use-escrow.ts` | `escrow.controller.ts` | ✅ |
| `use-orders.ts` | `orders.controller.ts` | ❌ **Missing: cancel endpoint** |
| `use-payments.ts` | `payments.controller.ts` | ✅ |
| `use-image-picker.ts` | — (client-only) | N/A |
| `use-vendor-analytics.ts` | `vendor.controller.ts` (earnings/analytics) | ✅ |

---

## 9. Recommendations

### Fix immediately (production-blocking)

| Priority | Action | Effort |
|----------|--------|--------|
| P0 | Add `POST /orders/:id/cancel` endpoint to OrdersController + OrdersService | 30 min |
| P0 | Create `CustomerPaymentMethodsController` at `/payment-methods` with full CRUD | 1 hr |
| P0 | Fix `POST /wallet/cards/verify` → rename to `verify-save` (or update mobile) | 5 min |
| P0 | Implement Paystack webhook signature verification in `payments.service.ts` | 30 min |

### Build soon (missing features)

| Priority | Action | Effort |
|----------|--------|--------|
| P1 | Create Story module: `GET /stories`, `POST /stories`, `DELETE /stories/:id`, `POST /stories/:id/view` | 2 hr |
| P1 | Add `GET /admin/disputes` and `POST /admin/disputes/:id/resolve` for admin dispute workflow | 1 hr |
| P1 | Add `GET /vendor/disputes` so vendors can see disputed orders | 30 min |
| P1 | Add `GET /admin/dashboard` returning key metrics (orders, revenue, users, vendors) | 1 hr |

### Improve (existing endpoints)

| Priority | Action | Effort |
|----------|--------|--------|
| P2 | Serve Swagger UI at `GET /api/docs` with `@nestjs/swagger` | 1 hr |
| P2 | Add pagination metadata (total, page, limit, totalPages) to all list endpoints | 2 hr |
| P2 | Add `GET /products/search` with full-text search | 1 hr |
| P2 | Add `GET /products/featured` for promoted products | 30 min |

### Clean up (architecture)

| Priority | Action | Effort |
|----------|--------|--------|
| P3 | Decide: merge food cart + main cart into one, or keep separate (document the choice) | — |
| P3 | Add `@ApiBearerAuth()` + proper response DTOs to all Swagger-decorated endpoints | 2 hr |
| P3 | Regenerate `swagger.json` to match current routes | 30 min |

---

## Quick Reference: Mobile API Calls That Will 404 in Production

These are the **exact** requests the mobile app makes that have no server handler:

```
POST   /orders/:id/cancel         → 404 — no route in orders.controller.ts
GET    /payment-methods            → 404 — no controller at all
POST   /payment-methods/card       → 404 — no controller
POST   /payment-methods/momo       → 404 — no controller
DELETE /payment-methods/:id        → 404 — no controller
PATCH  /payment-methods/:id/default → 404 — no controller
POST   /wallet/cards/verify-save   → 404 — server has /wallet/cards/verify (different path)
```

Fix these 7 mismatches and 121 out of 130 endpoints will be working end-to-end.
