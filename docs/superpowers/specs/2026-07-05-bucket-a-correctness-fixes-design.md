# Bucket A — Correctness Fixes (Design)

**Date:** 2026-07-05
**Status:** Approved (design), pending implementation plan
**Source audit:** `NONFUNCTIONAL-FEATURES-AUDIT.md` (repo root)
**Scope:** First of several remediation sub-projects toward "every feature 100% functional, no stubs." This bucket covers the *quick correctness* defects: dead routes, discarded input, dead buttons, and fake contact data. Higher-effort clusters (withdrawals/money, account security, reels video) are separate specs.

---

## Goals

Make nine specific defects behave honestly and functionally:

1. Dispatcher post-login redirect lands on a real screen.
2. Google social login always creates a customer (no broken vendor path).
3. Only Google sign-in is offered (Apple/Facebook removed, not faked).
4. Vendor "Top Customers" search and count are real.
5. Dispatcher "Help" button opens a real screen.
6. Service "Call provider" dials the real vendor number.
7. Paystack misconfiguration fails loudly in production.
8. Edit Profile persists everything it shows (no silently discarded fields).
9. "Call customer" / "Call driver" dial the real person.

## Non-goals (explicitly deferred)

- Full Apple/Facebook OAuth (needs external developer accounts) — future spec.
- A first-class vendor onboarding screen for social sign-up — belongs to the vendor/withdrawals sub-project.
- Swapping the production Paystack **test key** for a live key, APK→AAB, real Apple submit IDs — deploy-config sub-project. (This spec only makes a *missing* key fail loudly.)
- Any change to the vendor settings cluster, withdrawals, reels, or rewards — separate specs.

## Decisions locked during brainstorming

| Question | Decision |
|----------|----------|
| Apple/Facebook dead buttons | **Google-only, restyle** — remove Apple/FB, make Google the single prominent button. |
| Edit Profile bio/location (no DB columns today) | **Add bio + location for real** — schema migration + DTO + persistence. |
| Vendor-via-Google broken redirect | **Customer-only social login** — drop the vendor-intent branch; vendors still register via email/password. |
| Work structure | **Approach 1 (Hybrid, two PRs)** — client-only fixes first, server+schema fixes second. |

---

## Architecture / structure

Two sequential PRs:

- **PR-1 `fix/mobile-dead-routes`** — the seven client-only fixes. No migration, low risk, immediately testable on device.
- **PR-2 `fix/profile-and-call-data`** — the two fixes that need server + schema changes (Edit Profile bio/location; phone exposure for Call buttons), with Jest e2e coverage.

Rationale: banks seven honest fixes immediately and quarantines the single schema migration in its own reviewable change.

---

## PR-1 — Client-only fixes

### 1. Dispatcher post-login redirect
- **File:** `apps/mobile/app/_layout.tsx:111`
- **Change:** `/(dispatcher)/(tabs)/(dashboard)` → `/(dispatcher)/(tabs)/(home)`.
- **Note:** The VENDOR branch at `:109` (`/(vendor)/(dashboard)`) is valid; leave it. The current failure is swallowed by the surrounding `try/catch` (`:136`), which is why it presented as a silent dead end.

### 2 + 3. Social logins → Google-only, customer-only
- **File:** `apps/mobile/src/components/auth/SocialLogins.tsx`
- **Changes:**
  - Remove the `roleIntent === "vendor"` branch (`:44-45`) so a successful Google sign-in always `router.replace("/")`.
  - Delete the client-side `user.role = "VENDOR"` mutation (`:38-40`) — role is server-owned.
  - Remove the Apple (`:72`) and Facebook (`:102`) buttons.
  - Restyle Google as a single full-width primary sign-in button.
- **Server:** no change (only `google` is configured in `better-auth.ts`, which is now consistent with the UI).

### 4. Vendor "Top Customers"
- **File:** `apps/mobile/app/(vendor)/customers.tsx`
- **Changes:**
  - Bind the search `TextInput` (`:42`) to `useState` (`value` + `onChangeText`) and filter `customers` by name (case-insensitive).
  - Replace the hardcoded `"89 Total"` badge (`:29`) with `{filtered.length} Total` (or total `customers.length`).
  - "Message" button (`:105`) currently opens a synthesized `msg_${customer.id}` conversation that does not exist. Fix: only render it when the customer has a real conversation id; otherwise omit it. (If the customers payload lacks a conversation id, hide the button in this pass rather than fabricate one.)

### 5. Dispatcher "Help"
- **New file:** `apps/mobile/app/(dispatcher)/help.tsx` — a real Help screen: a small FAQ list plus a "Contact Support" action that files a genuine ticket via the existing role-agnostic `POST /support/tickets` (support controller is `AuthGuard`-only, so dispatchers are authorized).
- **Repoint:** `apps/mobile/app/(dispatcher)/(tabs)/(earnings)/index.tsx:41` → `/(dispatcher)/help`.
- **Rationale:** honest, functional content + real support wiring; avoids routing a dispatcher into the `(customer)` group.

### 6. Service "Call provider"
- **File:** `apps/mobile/app/(customer)/services/[id].tsx:186`
- **Change:** `tel:+233555555555` → `service.vendor.phone` (already present in the `customer-services` detail payload, `customer-services.service.ts:49`). Disable/hide the Call button when `vendor.phone` is null.

### 7. Paystack config guard
- **File:** `apps/mobile/app/_layout.tsx:159`
- **Change:** in production (`NODE_ENV`/`__DEV__` check), if `EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY` is absent, surface a visible error state instead of silently using `"pk_test_placeholder"`. Development retains a usable fallback.
- **Note:** does not change `eas.json`; swapping the prod test key for a live key is the deploy-config sub-project.

---

## PR-2 — Server + schema fixes

### 8. Edit Profile persists real data

**Schema** — `apps/server/prisma/schema.prisma`, `model User` (after the existing profile fields):
```prisma
bio       String?
location  String?
```
Migration name: `add_user_bio_location`. Both nullable → no backfill, forward-safe.

**Server:**
- `apps/server/src/modules/users/dto/update-profile.dto.ts` — add:
  ```ts
  @IsOptional() @IsString() @MaxLength(300) bio?: string;
  @IsOptional() @IsString() @MaxLength(120) location?: string;
  ```
- `apps/server/src/modules/users/users.service.ts` — add `bio: true, location: true` to the shared `select` (`:9`) so both `getMe` and the update response return them. The existing `data: dto` spread in `updateProfile` (`:43`) persists the new fields with no logic change.

**Client** — `apps/mobile/src/components/screens/EditProfileScreen.tsx`:
- `handleSave` sends `{ name, image, bio, location }` (currently `{ name, image }`, `:64-65`).
- Email and Phone become **read-only** rows with a "Change"/"Verify" affordance:
  - Phone → existing `edit-phone` flow.
  - Email → existing email verification flow.
- Prefill `bio`/`location` from `user` (already wired, `:47-48`).
- Screen is shared by the customer and dispatcher `edit-profile` routes, so both are fixed together.

### 9. Call buttons reach real people

**Server** — `apps/server/src/modules/delivery/delivery.service.ts`: add `phoneNumber: true` to the customer and dispatcher `user` selects in the delivery-job payloads:
- Active-job selects at `:303` and `:327` (customer select).
- `getJob` include at `:593` (customer) and `:601` (dispatcher `user`).
No new endpoint — only widening existing selects. `User.phoneNumber` already exists.

**Client:**
- `apps/mobile/app/(customer)/track-order.tsx:288` — `tel:0541234567` → `job.dispatcher.user.phoneNumber`.
- `apps/mobile/app/(dispatcher)/(tabs)/(home)/index.tsx:143` — `tel:0551234567` → `displayRide.customer.phoneNumber`.
- Both: when the phone is null, disable the Call button with an "unavailable" state instead of dialing a broken `tel:`.

---

## Error handling (both PRs)

- Newly-wired mutations report failures through the existing `Toast` / `usePopupStore` patterns — no silent `catch`.
- All new optional data (phone, bio, location) is null-guarded so a missing value degrades gracefully (disabled control / empty field), never a crash or a garbage `tel:`.

## Testing

**PR-2 server (Jest e2e), extending existing specs:**
- `PATCH /users/profile` persists and returns `bio`/`location`.
- `GET /users/me` returns `bio`/`location`.
- Delivery-job payloads (`getJob` + active job) include `phoneNumber` for customer and dispatcher.
- Migration applies cleanly against the test schema.

**Mobile (manual — no mobile e2e harness today, per existing convention):**
- Dispatcher login lands on `(home)`.
- Google sign-in produces a `CUSTOMER`; no Apple/FB buttons visible.
- Vendor "Top Customers": search filters; count reflects real data.
- Dispatcher "Help" opens and can file a support ticket.
- Edit Profile save round-trips `bio`/`location`; email/phone are read-only and route to verify flows.
- Call customer / driver / provider dial the real number and disable when absent.

## Risks / notes

- **Migration** is the only stateful change; nullable columns make it low-risk and reversible.
- **Vendor "Message" button** depends on whether the vendor-customers payload carries a real conversation id. If it does not, the button is hidden in this pass (documented above) rather than fabricating a thread — full vendor↔customer messaging is out of scope here.
- No changes to money, auth-provider, withdrawal, reels, or vendor-settings surfaces — those remain tracked in `NONFUNCTIONAL-FEATURES-AUDIT.md` for their own specs.
