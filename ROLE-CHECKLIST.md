# Role Relations — Remediation Checklist

**Source:** `ROLE-RELATIONS-AUDIT.md`
**Progress:** `[ ]` = pending · `[x]` = completed · `[-]` = wontfix

---

## 🟥 Critical (0)

_None in this audit._

---

## 🟧 High (3)

- [x] **RR-1 — Fix mobile root layout routing**
  `apps/mobile/app/_layout.tsx:65` — Route based on `user.role` instead of hardcoding `/(customer)/(tabs)/(home)`. Vendor → `/(vendor)`, Dispatcher → `/(dispatcher)`, Customer → `/(customer)`.

- [x] **RR-2 — Fix auth store hydration**
  `apps/mobile/src/lib/stores/auth-store.ts` — Fetch user profile during `hydrate()` so `user.role` is available on cold start. Currently only restores token, leaving `user` null.

- [x] **RR-3 — Dispatcher createProfile safety**
  `apps/server/src/modules/dispatcher/dispatcher.service.ts` — Before mutating `user.role = "dispatcher"`, check if user already has a conflicting role/profile. At minimum, prevent overwriting vendor/admin status.

---

## 🟡 Medium (4)

- [x] **RR-4 — Add role guards to vendor/dispatcher controllers**
  - Create `VendorGuard` that checks for existence of `VendorProfile` (not role string)
  - Create `DispatcherGuard` that checks for existence of `DispatcherProfile`
  - Apply to all vendor/dispatcher controller routes

- [x] **RR-5 — Add DB-level role validation**
  `apps/server/prisma/schema.prisma:18` — Convert `role String` to a Prisma enum (`enum Role { CUSTOMER VENDOR DISPATCHER ADMIN }`) to prevent invalid role values at the database level.

- [x] **RR-6 — Evaluate multi-role support**
  Decide whether a user should be able to hold multiple roles (e.g. vendor + dispatcher). If yes, design a junction table (`UserRole`) or array field. If no, add guard checks that prevent role overwrites.

- [x] **RR-7 — Update user.role when becoming a vendor**
  `VendorService.onboard()` or admin approval flow — Update `user.role` to `"vendor"` when a customer is approved as a vendor (currently the role stays `"customer"`).

---

## 🟢 Low (3)

- [x] **RR-8 — Validate known roles in admin updateUserRole**
  `AdminService.updateUserRole()` — Validate input against an allowlist of known role values before updating.

- [x] **RR-9 — Add admin escrow dispute resolution**
  Add `AdminController.resolveDispute()` with an admin-only endpoint to release/refund disputed escrows. Currently dispute resolution is self-service between buyer and vendor with no oversight.

- [-] **RR-10 — Evaluate chat cross-role restrictions**
  Decide if cross-role messaging should be restricted (e.g. customers should only message vendors they've ordered from). Currently chat is entirely role-agnostic.

---

## Summary

| Severity | Count | Target |
|---|---|---|
| 🟧 High | 3 | Mobile routing, auth hydration, dispatcher safety |
| 🟡 Medium | 4 | Guards, DB validation, multi-role, vendor role sync |
| 🟢 Low | 3 | Role validation, escrow oversight, chat restrictions |
| **Total** | **10** | |
