# Role Relations Audit

## Overview

Audit of Bexiemart's four-role system (Customer, Vendor, Dispatcher, Admin) across the server (NestJS) and mobile (Expo Router) codebases. Focus is on authorization guards, role routing, multi-tenancy, and cross-role data access boundaries.

---

## 1. Role Model — Schema

### 1.1 Prisma Schema
| File | Line | Definition |
|---|---|---|
| `schema.prisma` | 18 | `role String @default("customer")` |

- Role is stored as a **plain `String`** — no Prisma enum, no DB-level validation
- Default value is `"customer"` — not validated against known roles on write
- A user can only hold **one role** — no multi-role support

### 1.2 Server-Side Enforcement
| Guard | File | Behavior |
|---|---|---|
| `AuthGuard` | `guards/auth.guard.ts` | Attaches `user` object via Better Auth session; **no role check** |
| `AdminGuard` | `guards/admin.guard.ts` | Checks `request.user?.role !== "admin"` — simple string comparison |

**Findings:**
- There is **no `VendorGuard`**, **no `DispatcherGuard`**, and **no `CustomerGuard`**
- Vendor/dispatcher controllers rely solely on `AuthGuard` — any authenticated user can hit these endpoints
- Service-layer methods (e.g. `vendorService.onboard()`) implicitly assume the caller has the right profile, but this is not enforced at the guard level

---

## 2. Controller Authorization

### 2.1 Role Enforcement Per Controller
| Controller | Guard(s) | Role Check | Notes |
|---|---|---|---|
| `AdminController` | `AuthGuard, AdminGuard` | ✅ Checks `role === "admin"` | Only proper guard chain |
| `VendorController` | `AuthGuard` | ❌ None | Any auth user can call vendor endpoints |
| `DispatcherController` | `AuthGuard` | ❌ None | Any auth user can call dispatcher endpoints |
| `OrdersController` | `AuthGuard` | ❌ None | Service resolves ownership by user ID |
| `EscrowController` | Per-route `AuthGuard` | ❌ None | `list()` shows both buyer & vendor escrows |
| `PaymentsController` | `AuthGuard` | ❌ None | Webhook has no guard (expected) |
| `ChatController` | `AuthGuard` | ❌ None | Role-agnostic messaging |
| `ProductsController` | `AuthGuard` | ❌ None | Public read for any auth user |
| `WalletController` | `AuthGuard` | ❌ None | User-scoped |
| All other controllers | `AuthGuard` | ❌ None | No role checks |

### 2.2 Missing Guards
- **Missing `VendorGuard`** — vendors are identified by existence of `VendorProfile` record, not by role string
- **Missing `DispatcherGuard`** — dispatchers are identified by existence of `DispatcherProfile` record
- The dispatcher's `createProfile()` **mutates `user.role` to `"dispatcher"`** with no prior role check — if a customer is already a vendor, the vendor role is silently overwritten

---

## 3. Mobile Role Routing

### 3.1 Root Layout Routing (`app/_layout.tsx`)
```typescript
// Line 65 — critical bug
if (isAuthenticated && (inAuthGroup || inOnboardingGroup)) {
  router.replace("/(customer)/(tabs)/(home)");
}
```

**Finding:** ALL authenticated users are redirected to the customer tab layout regardless of role. Vendors and dispatchers see the customer UI first until they navigate manually to their respective routes.

### 3.2 Auth Store (`auth-store.ts`)
- Stores `user.role` (string) but it's **only populated by `setAuth()` / `setUser()`**
- `hydrate()` restores token from SecureStore but does **not** fetch the user object — `user` remains `null` until a manual API call or a re-login
- On app restart, `user` is `null` even when authenticated — role-based routing cannot work until the user is fetched

### 3.3 Role Layouts Available
| Route | Purpose |
|---|---|
| `(customer)` | Customer tabs (home, shop, reels, orders, profile) |
| `(vendor)` | Vendor dashboard, products, orders, earnings, inbox, settings |
| `(dispatcher)` | Dispatcher tabs, earnings |
| `(auth)` | Login, register |
| `(onboarding)` | Welcome flow |

---

## 4. Cross-Role Data Access

### 4.1 Order Ownership
- `OrdersService.getOrders(userId)` returns orders where `userId` matches **customer ID** — vendors cannot see their own orders through this endpoint
- Vendors see orders via `VendorController.getOrders()` → `VendorService.getOrders(vendorUserId)` which queries by product owner's shop
- No admin oversight endpoint for orders (admin has own `AdminController.getOrders()`)

### 4.2 Escrow
- `EscrowService.list(userId)` queries by **both** buyer wallet **and** vendor profile — vendors see escrows where they are the vendor, customers see escrows where they are the buyer
- Dispute resolution (`dispute()`, `release()`, `refund()`) is in `EscrowService` — no admin role needed
- **No admin dispute workflow** — disputes are self-service between buyer and vendor

### 4.3 Chat
- `ChatService` is role-agnostic — any authenticated user can message any other
- Conversations are participant-based with no role checks
- Gateway (`ChatGateway`) handles presence, messaging, read receipts

### 4.4 Wallet
- Every user has exactly one wallet — shared across roles
- Vendors and dispatchers withdraw earnings from the same wallet model
- There is no escrow-specific wallet isolation

---

## 5. Role Transition & Lifecycle

### 5.1 Customer → Vendor
- Admin approves via `AdminController.approveVendor(id)` (sets `VendorProfile.isActive`, not the user role)
- `VendorService.onboard()` **expects the vendor profile to already exist** and only updates shop details
- No guard prevents a dispatcher from also becoming a vendor (or vice versa)
- `user.role` is NOT changed to `"vendor"` — the role remains `"customer"` even after becoming a vendor

### 5.2 Customer → Dispatcher
- `DispatcherService.createProfile()` creates a `DispatcherProfile` **and** mutates `user.role = "dispatcher"`
- **No prior role check** — silently overwrites any existing role
- No approval workflow — any user can become a dispatcher instantly

### 5.3 Admin Role
- `AdminController.updateUserRole()` is the only endpoint to change roles
- Does not validate against known role values

---

## 6. Security Issues

| # | Severity | Issue |
|---|---|---|
| RR-1 | **High** | Mobile root layout redirects all roles to customer home — vendors/dispatchers never see their own UI |
| RR-2 | **High** | Auth store `hydrate()` doesn't fetch user — role is unavailable on cold start |
| RR-3 | **High** | Dispatcher `createProfile()` mutates `user.role` with no prior check — can silently overwrite vendor status |
| RR-4 | **Medium** | No role guards on vendor/dispatcher controllers — any auth user can hit these endpoints |
| RR-5 | **Medium** | Role stored as plain `String` with no DB-level validation — invalid role values possible |
| RR-6 | **Medium** | No multi-role support — a user cannot be both vendor and dispatcher |
| RR-7 | **Medium** | `user.role` is NOT updated when becoming a vendor — vendor status is implicit via `VendorProfile` |
| RR-8 | **Low** | Admin `updateUserRole` has no validation against known role values |
| RR-9 | **Low** | Escrow dispute resolution has no admin oversight — buyers/vendors can release/refund without admin |
| RR-10 | **Low** | Chat is role-agnostic — no restrictions on cross-role messaging |

---

## 7. Recommendations

1. **Add role guards**: Create `VendorGuard` (checks for `VendorProfile`) and `DispatcherGuard` (checks for `DispatcherProfile`)
2. **Fix mobile routing**: Update root `_layout.tsx` to route based on `user.role`
3. **Fix auth hydration**: Fetch user profile during `hydrate()` so role is available on cold start
4. **Add DB-level role validation**: Use a Prisma enum or add a `@@validate` constraint
5. **Add multi-role support**: Consider a junction table or an array field if users need multiple roles
6. **Add admin dispute workflow**: Add `AdminController.resolveDispute()` for escrow oversight
7. **Add Prisma transactions**: Wrap order creation (order + escrow + wallet tx + stock update) in a transaction
8. **Add idempotency**: Add API-level idempotency keys for payment and order creation
