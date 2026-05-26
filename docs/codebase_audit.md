# 🔍 BexieMart Codebase Audit — AI Sloppiness Report

> Audited: 2026-05-08 | Scope: `server/`, `src/`, `dev-proxy.ts`, `prisma/schema.prisma`

---

## Summary

The codebase has a **well-designed Prisma schema** and decent structural scaffolding, but the server routes are overwhelmingly **stub implementations** — endpoints that return hardcoded JSON instead of querying the database. Combined with zero authentication guards, no input validation, no tests, and `any`-typed escape hatches throughout, this is a prototype dressed as a product.

---

## 🚨 1. Stub / Fake Routes (THE CRITICAL PROBLEM)

The Prisma schema defines 14 models with proper relations, indexes, and enums. But **only `products.ts` actually uses Prisma**. Every other route file returns hardcoded fake data.

| Route File | Uses DB? | What It Actually Does |
|---|---|---|
| [products.ts](file:///c:/Users/Jerry/Desktop/PROJECT%202026/Bexiemart_new/Bexiemart_new/server/routes/products.ts) | ✅ Prisma | Real CRUD — **only production-ready route** |
| [orders.ts](file:///c:/Users/Jerry/Desktop/PROJECT%202026/Bexiemart_new/Bexiemart_new/server/routes/orders.ts) | ❌ | `createOrder` returns fake JSON with `crypto.randomUUID()`. `getUserOrders` returns `{ orders: [] }`. `getOrderById` returns `'BEX-PLACEHOLDER'` |
| [cart.ts](file:///c:/Users/Jerry/Desktop/PROJECT%202026/Bexiemart_new/Bexiemart_new/server/routes/cart.ts) | ❌ | Every handler returns hardcoded objects. `getCart` → `{ items: [], subtotal: 0 }` |
| [vendor.ts](file:///c:/Users/Jerry/Desktop/PROJECT%202026/Bexiemart_new/Bexiemart_new/server/routes/vendor.ts) | ❌ | `getVendorProfile` returns `{ id: 'temp-vendor-id', shopName: 'My Shop' }` |
| [payments.ts](file:///c:/Users/Jerry/Desktop/PROJECT%202026/Bexiemart_new/Bexiemart_new/server/routes/payments.ts) | ❌ | Paystack API calls work, but **no payment records are persisted**. Webhook is a no-op stub |
| [upload.ts](file:///c:/Users/Jerry/Desktop/PROJECT%202026/Bexiemart_new/Bexiemart_new/server/routes/upload.ts) | ❌ | Cloudinary upload works, but no record of uploaded images is stored |

**Wishlist** handlers ([products.ts:164-180](file:///c:/Users/Jerry/Desktop/PROJECT%202026/Bexiemart_new/Bexiemart_new/server/routes/products.ts#L164-L180)) are pure stubs — `getWishlist` literally returns `[]`.

---

## 🔓 2. Security Vulnerabilities

### 2.1 Zero Authentication Guards

**Not a single route checks if the user is logged in.** Anyone can:
- Create products (`POST /api/products`) — no vendor check
- Update order statuses (`PUT /api/orders/:id/status`) — no admin/vendor check
- Access vendor dashboard (`GET /api/vendor/dashboard`) — no user identity
- Delete products (`DELETE /api/products/:id`) — no ownership check

```
EVERY route is publicly accessible. There is no auth middleware.
```

### 2.2 No Input Validation

- `products.ts` destructures `readBody(event)` without type checking or Zod validation
- `payments.ts` sends user-provided `amount` directly to Paystack — **price manipulation vulnerability**
- `upload.ts` accepts any base64 string — no file size limits, no MIME type validation
- `createCategory` accepts any name — no duplicate checking, no sanitization

### 2.3 Webhook Security

[payments.ts:102-117](file:///c:/Users/Jerry/Desktop/PROJECT%202026/Bexiemart_new/Bexiemart_new/server/routes/payments.ts#L102-L117): `PAYSTACK_WEBHOOK_SECRET` is loaded but **never used**. The webhook handler doesn't verify the Paystack signature, meaning anyone can POST fake payment confirmations.

### 2.4 Secrets Exposed via API

[upload.ts:98-108](file:///c:/Users/Jerry/Desktop/PROJECT%202026/Bexiemart_new/Bexiemart_new/server/routes/upload.ts#L98-L108): `generateSignature` returns `apiKey` and `cloudName` in the response. While `apiKey` is semi-public, the endpoint has no auth — any crawler can harvest these.

### 2.5 CORS Wildcard Fallback

[dev-proxy.ts:33](file:///c:/Users/Jerry/Desktop/PROJECT%202026/Bexiemart_new/Bexiemart_new/dev-proxy.ts#L33): `req.headers.origin || '*'` means requests without an origin header get a wildcard CORS response.

---

## 🏗️ 3. Architecture Problems

### 3.1 The Auth Proxy Hack

[auth.ts:149-157](file:///c:/Users/Jerry/Desktop/PROJECT%202026/Bexiemart_new/Bexiemart_new/server/auth.ts#L149-L157): The `auth` export is a `Proxy({})` typed as `any`. This means:
- Zero type safety for `auth.handler`, `auth.api`, etc.
- Runtime errors instead of compile-time errors
- IDE autocomplete is broken
- 3 separate `eslint-disable` comments to silence warnings

### 3.2 Dual Database Connection Strategy

- `auth.ts` uses `@neondatabase/serverless` Pool (WebSocket transport)
- `products.ts` uses `@prisma/adapter-pg` with `process.env.DATABASE_URL`
- These are **two separate connection pools** to the same database
- `pg` is still in `package.json` despite being replaced

### 3.3 PrismaClient Created Per-File

[products.ts:17-20](file:///c:/Users/Jerry/Desktop/PROJECT%202026/Bexiemart_new/Bexiemart_new/server/routes/products.ts#L17-L20): A new `PrismaClient` is instantiated at module scope. With `tsx watch` hot-reloading, this creates connection pool leaks. There's no singleton pattern.

### 3.4 Inconsistent Response Shapes

- `getProducts` returns `{ data: [...], page, totalItems }` (paginated envelope)
- `getProductById` returns the raw product object (no envelope)
- `createOrder` returns `{ success: true, order: {...} }`
- `deleteProduct` returns `{ success: true }`
- There's no standardized API response wrapper

### 3.5 Orphaned Files

- `proxy-server.js` (384 bytes) — superseded by `dev-proxy.ts`
- `start-server.bat` — likely outdated
- `dev.db` (45KB SQLite) — leftover from an earlier SQLite setup
- `nul` (219 bytes) — Windows artifact from a failed redirect

---

## 🔧 4. Type Safety Issues

### 4.1 `any` Epidemic

| Location | Issue |
|---|---|
| [auth.ts:62](file:///c:/Users/Jerry/Desktop/PROJECT%202026/Bexiemart_new/Bexiemart_new/server/auth.ts#L62) | `let _auth: any` |
| [auth.ts:153](file:///c:/Users/Jerry/Desktop/PROJECT%202026/Bexiemart_new/Bexiemart_new/server/auth.ts#L153) | `export const auth: any` |
| [useAuth.ts:38](file:///c:/Users/Jerry/Desktop/PROJECT%202026/Bexiemart_new/Bexiemart_new/src/hooks/useAuth.ts#L38) | `(data?.user as any)?.role` |
| [authStore.ts](file:///c:/Users/Jerry/Desktop/PROJECT%202026/Bexiemart_new/Bexiemart_new/src/stores/authStore.ts) | Uses `User` from types but Better Auth returns different shape |
| [config/auth.ts:41](file:///c:/Users/Jerry/Desktop/PROJECT%202026/Bexiemart_new/Bexiemart_new/src/config/auth.ts#L41) | `useState<{ user: any; session: any } | null>` |

### 4.2 Untyped `readBody` Calls

In `products.ts`, `payments.ts`, `cart.ts`, `upload.ts` — `readBody(event)` returns `unknown` but is destructured directly without type guards. Only `orders.ts` has explicit interfaces (added during earlier fixes).

### 4.3 Client-Server Type Mismatch

The `src/types/index.ts` defines `Order.discount`, `Order.deliveryFee`, `Order.isPaid`, `Order.paymentMethod` — but the Prisma schema has `Order.shippingFee`, `Order.tax`, `Order.paymentStatus`, `Order.paystackRef`. These are completely different shapes.

Similarly:
- Client `VendorProfile` has `shopDescription`, `shopLogo`, `shopBanner`, `rating`, `totalSales`
- Prisma `VendorProfile` has `description`, `logo`, `banner`, `totalEarnings`, `pendingPayout`

---

## 🗄️ 5. Database Concerns

### 5.1 No Migrations in Git

There's no `prisma/migrations/` directory visible. The schema exists but may never have been migrated to the Neon database. Better Auth creates its own tables, but the commerce tables (Product, Order, Cart, etc.) need explicit migration.

### 5.2 Financial Data Stored as Float

```prisma
price       Float
subtotal    Float
total       Float
totalEarnings Float
```

Using `Float` for money causes rounding errors. Production systems use `Decimal` (Prisma) or integer cents.

### 5.3 No Soft Delete Consistency

Products have `isDeleted`, but orders, cart items, payments, and vendor profiles don't. Inconsistent deletion strategy.

---

## 🧪 6. Missing Infrastructure

| Category | Status |
|---|---|
| **Tests** | ❌ Zero test files in `src/` or `server/` |
| **ESLint** | ❌ No config file (only inline `eslint-disable` comments) |
| **Prettier** | ❌ Not configured |
| **CI/CD** | ❌ No GitHub Actions or deployment pipeline |
| **Logging** | ❌ Only `console.log` / `console.error` |
| **Error monitoring** | ❌ No Sentry, Bugsnag, or equivalent |
| **Rate limiting** | ❌ None on any endpoint |
| **Health check** | ⚠️ Exists but doesn't test actual DB connectivity (hardcoded string) |
| **Environment validation** | ❌ No Zod schema for env vars — server silently breaks on missing keys |

---

## 📱 7. Frontend Issues

### 7.1 `useGetMe` Should Be a Query, Not a Mutation

[useAuth.ts:154-164](file:///c:/Users/Jerry/Desktop/PROJECT%202026/Bexiemart_new/Bexiemart_new/src/hooks/useAuth.ts#L154-L164): `useGetMe()` uses `useMutation` for a read operation. This should be `useQuery` for proper caching, deduplication, and background refetching.

### 7.2 Duplicate Auth State

Session state is managed in **three places**:
1. `useSession()` hook in `config/auth.ts` (Better Auth's own session)
2. `useAuthStore` Zustand store (manual mirror)
3. `useGetMe()` mutation (fetches session on demand)

These are never synchronized — logging in via `useLogin()` doesn't update `useAuthStore`, and `useAuthStore.signOut()` doesn't invalidate `useSession()`.

### 7.3 Stale Type Definitions

`types/index.ts` defines `AuthTokens`, `LoginResponse`, `RegisterResponse` — all from a pre-Better-Auth JWT-based setup. Better Auth uses cookie-based sessions, making these types dead code.

---

## 🚀 8. Deployment Gaps

- No `Dockerfile` or container config
- No `production` build script for the server
- `h3@2.0.1-rc.22` — using a **release candidate** in production
- `nativewind@5.0.0-preview.3` — using a **preview** release
- `server` script uses `tsx watch` which is dev-only

---

## 📋 Production Remediation Plan

### Phase 1: Foundation (Critical — do first)

1. **Create auth middleware** — Extract user from Better Auth session, attach to `event.context.user`, reject unauthenticated requests
2. **Wire all stub routes to Prisma** — Orders, Cart, Vendor, Wishlist, Payments all need real DB queries
3. **Create a shared Prisma singleton** — Single `PrismaClient` instance used across all routes
4. **Add Zod validation** to every `readBody()` call
5. **Verify Paystack webhook signatures** before processing
6. **Fix financial data types** — `Float` → `Decimal` in schema, integer cents in code

### Phase 2: Type Safety & Architecture

7. **Type the auth instance** — Replace `any` proxy with proper `ReturnType<typeof betterAuth>` or Better Auth's inferred type
8. **Align client/server types** — Generate TypeScript types from Prisma schema, share between client and server
9. **Standardize API responses** — `{ data, error, meta }` envelope for all endpoints
10. **Consolidate auth state** — Pick ONE source of truth (Better Auth's `useSession()`) and remove the Zustand mirror
11. **Remove dead code** — `AuthTokens`, `LoginResponse`, orphaned files

### Phase 3: Infrastructure

12. **Add ESLint + Prettier** with strict TypeScript rules
13. **Set up testing** — Jest/Vitest for server routes, React Testing Library for components
14. **Add structured logging** — Replace `console.*` with Pino or Winston
15. **Environment validation** — Zod schema checked at startup, fail-fast on missing vars
16. **Rate limiting** — H3 rate limiter middleware on auth and payment routes
17. **Real health check** — `SELECT 1` against DB in `/api/health`

### Phase 4: Deployment

18. **Lock dependency versions** — Replace RC/preview packages or accept the risk
19. **Add production server script** — Build step + Node.js runner (no `tsx watch`)
20. **Dockerize** — Multi-stage build (build → runtime)
21. **CI/CD pipeline** — Lint → Test → Build → Deploy
22. **Error monitoring** — Sentry or equivalent

---

> [!IMPORTANT]
> **Phase 1 is non-negotiable before any user-facing launch.** Without auth guards and real DB queries, the app is a read-only demo with publicly writable endpoints. Phase 2-4 can be iterative.

Which phase do you want to start with?
