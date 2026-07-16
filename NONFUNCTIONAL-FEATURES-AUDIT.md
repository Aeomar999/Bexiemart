# Non-Functional Features Audit — 2026-07-05

Scope: every feature, button, and flow across `apps/mobile`, `apps/admin`, `apps/server` that is not functional or not functioning correctly. Method: full-tree pattern sweeps (mock/setTimeout/dead-handler/hardcoded-data), route-existence check of all navigation targets, and endpoint cross-check of every suspicious client call against server controllers.

Legend: 🔴 broken/fake in a money or auth path · 🟠 fake feature (UI pretends success) · 🟡 dead control / placeholder content · ⚙️ config blocker

---

## 1. Money paths

| # | Sev | Location | Issue |
|---|-----|----------|-------|
| 1 | 🔴 | `apps/mobile/app/(vendor)/(earnings)/withdraw.tsx:46` | `availableBalance = 1250.0` **hardcoded** — the vendor sees a fake balance and the insufficient-funds check runs against it. |
| 2 | 🔴 | same file `:22-25`, `:90-115` | Withdrawal methods are hardcoded fake accounts (`"024 **** 567"`, `"Ecobank **** 1234"`). The **masked fake string is sent to the server as `destination`**. "Add method" only mutates local state (`method_${Date.now()}`) and is lost on unmount. |
| 3 | 🔴 | same file `:73-80` + `apps/server/src/modules/vendor/vendor.controller.ts:111-115` | PIN pad collects a 4-digit PIN that is **never sent** — `WithdrawEarningsDto` is `{amount, destination}`. Server does not verify PIN for vendor earnings withdrawals (customer `wallet/withdraw` *does* take a pin — inconsistent). |
| 4 | 🔴 | `apps/mobile/app/(dispatcher)/(tabs)/(earnings)/withdraw.tsx:22-25,79` | Dispatcher twin of the above: same fake hardcoded methods, same unsent PIN. (Balance is real here: `earnings.pendingClearance`.) |
| 5 | 🟠 | `apps/mobile/app/(customer)/wallet/rewards.tsx:65-71` | **"Convert Coins" is fake** — confirm dialog then `Alert.alert("Success", "Coins converted successfully!")`; no API call, wallet never credited. Also: "Gold Tier Member" hardcoded, "How to earn" checklist static with hardcoded `completed` flags. |
| 6 | ⚙️ | `apps/mobile/eas.json:52` | **Production build ships the TEST Paystack key** (`pk_test_8cd3…`) — production payments run in test mode. |

## 2. Auth flows

| # | Sev | Location | Issue |
|---|-----|----------|-------|
| 7 | 🔴 | `apps/mobile/app/_layout.tsx:110` | Dispatcher post-login redirect targets `/(dispatcher)/(tabs)/(dashboard)` — **no `(dashboard)` group exists** (groups are `(home)`, `(earnings)`). The failure is swallowed by the surrounding try/catch, so dispatchers can silently fail to land anywhere after login. |
| 8 | 🔴 | `apps/mobile/src/components/auth/SocialLogins.tsx:45` | Vendor social login redirects to `/vendor/setup` (cast `as any` to silence TS) — **route does not exist** → Unmatched Route after a successful OAuth. Also `:38-40` sets `user.role = "VENDOR"` client-side only (server role unchanged). |
| 9 | 🟡 | `SocialLogins.tsx:72,102` | **Apple and Facebook buttons are dead** — server `better-auth.ts` configures only `google` in `socialProviders`. Tapping them errors. |
| 10 | 🔴 | `apps/admin/src/app/(dashboard)/settings/security/page.tsx` + `apps/admin/src/lib/api/auth.ts:18-23` | Admin change-password posts `/auth/change-password` → better-auth catch-all, but **better-auth has no `bearer()` plugin** — it authenticates by session cookie only, while the admin sends `Authorization: Bearer`. Result: 401 every time. The code comment admits the endpoint is a guess ("We'll use a placeholder"). |
| 11 | 🔴 | `apps/admin/src/lib/stores/auth-store.ts` | Admin JWT persisted to **localStorage** (`zustand/persist "bexiemart-admin-auth"`) — XSS = admin session theft. (Known from prior security audit; still present.) |
| 12 | 🟠 | `apps/server/src/auth/better-auth.ts:139-146` | `trustedOrigins` lists only localhost + app schemes — the deployed admin (Vercel) origin is missing, which will break better-auth CSRF-checked routes from production admin. |

## 3. Vendor settings cluster — all fake

| # | Sev | Location | Issue |
|---|-----|----------|-------|
| 13 | 🟠 | `(vendor)/(settings)/change-password.tsx:130-137` | Submit = `// Mock successful save` + `router.back()`. "Forgot Current Password?" → `onPress={() => {}}`. |
| 14 | 🟠 | `(vendor)/(settings)/change-pin.tsx:87-94` | Same: mock save, dead "Forgot PIN?" link. No forgot-PIN flow exists server-side. |
| 15 | 🟠 | `(vendor)/(settings)/two-factor.tsx` | **Entire 2FA screen is theater**: `useState(true)` toggle, fake phone `+233 ** *** *492`, dead backup-method rows. No 2FA plugin on server. |
| 16 | 🟠 | `(vendor)/(settings)/security.tsx:100-146` | Device sessions hardcoded ("MacBook Pro · Accra, Ghana · 2 days ago"); "Log out of this device" = `// Mock logging out`. No session-listing endpoint exists. |
| 17 | 🟠 | `(vendor)/(settings)/notification-settings.tsx` | 7 notification toggles are local state only — never persisted, never affect anything. (No preferences endpoint server-side.) |
| 18 | 🟠 | `(vendor)/(settings)/contact.tsx:15-23,48` | "Contact Support" ticket = `setTimeout` + success alert, **nothing is sent** (real support module exists at `/support` but isn't used here). "Issue Category" dropdown Pressable has no onPress. |
| 19 | 🟠 | `(vendor)/(settings)/taxes.tsx:59-78` | Document upload/delete are real, but final **"submit for verification" is fake** — `setTimeout` + "Verification Pending" alert; the TIN is never sent anywhere. |

## 4. Reels — feature is a simulation

| # | Sev | Location | Issue |
|---|-----|----------|-------|
| 20 | 🟠 | `(customer)/(tabs)/reels.tsx:104` | Reels render an `<Image>` of `videoUrl` — comment says "Background Video/Image Simulator". **No video playback exists.** |
| 21 | 🟠 | `reels.tsx:67-75, 278` | **Comments are fake**: `handlePostComment` shows "Comment Added" popup and clears the input — nothing is saved; the modal always shows hardcoded "0 comments" / "No comments yet". (Likes and native Share ARE real.) |
| 22 | 🟠 | `(vendor)/add-reel.tsx:42-53` | Vendor "video upload" is simulated: 1.5s fake progress then sets a **stock Unsplash image** as the "video". The reel then publishes that image via the real API. |

## 5. Dead buttons, fake data, placeholder contacts (mobile)

| # | Sev | Location | Issue |
|---|-----|----------|-------|
| 23 | 🔴 | `(dispatcher)/(tabs)/(home)/index.tsx:142-144` | "Call customer" dials hardcoded `tel:0551234567` — `// Mock customer phone`. Drivers can never reach the actual customer. |
| 24 | 🔴 | `(customer)/track-order.tsx:288` | "Call driver" dials hardcoded `tel:0541234567` — not the actual dispatcher's number. |
| 25 | 🟠 | `(customer)/services/[id].tsx:186` | "Call provider" dials hardcoded `tel:+233555555555`. |
| 26 | 🟡 | `(customer)/contact.tsx:52,75` | Support contacts `support@bexiemart.com` / `tel:+233241234567` — number matches the placeholder pattern used in form hints; verify it's a real line. |
| 27 | 🟡 | `(vendor)/customers.tsx:28-30,42` | "Top Customers": search box has no value/onChangeText (**dead**), "89 Total" badge hardcoded regardless of data. |
| 28 | 🟠 | `(vendor)/customers.tsx:105` | "Message" button pushes `/(vendor)/inbox/msg_${customer.id}` — a **synthesized conversation id**; there is no such conversation. |
| 29 | 🟡 | `(dispatcher)/(tabs)/(earnings)/index.tsx:41` | "Help" pushes `/(dispatcher)/(settings)/help` — **route doesn't exist** (no dispatcher settings group at all) → Unmatched Route. |
| 30 | 🟡 | `(dispatcher)/(tabs)/profile.tsx:58-99` | Metrics hardcoded (4.9 rating / 98% acceptance / 142 trips), vehicle details hardcoded ("Motorbike"), `autoAccept` toggle local-only. |
| 31 | 🟡 | `(customer)/review-modal.tsx:39-42` | "Add photo" is simulated — the toast literally says "Simulated photo upload from camera roll". (Rating/comment submission is real.) |
| 32 | 🟡 | `src/components/screens/EditProfileScreen.tsx:64-65` | Screen offers Name/Email/Phone/Location/Bio, but save sends only `{name, image}` — **email/phone/bio/location edits are silently discarded**. (Phone has its own working `edit-phone` flow.) |

## 6. Admin portal

| # | Sev | Location | Issue |
|---|-----|----------|-------|
| 33 | 🟠 | `settings/notifications/page.tsx:16-23` | "Save Preferences" is a simulated save — `setTimeout(800)` + success toast; comment admits backend support doesn't exist. |
| 34 | 🔴 | Security page change-password | Broken (see #10). |
| — | ✅ | everything else | Users, vendors, dispatchers, orders, disputes, moderation, marketing (banners/coupons/flash-sales), referrals, reports, platform & delivery config all use real endpoints (`/admin/config` etc. verified). |

## 7. Build & deploy config

| # | Sev | Location | Issue |
|---|-----|----------|-------|
| 35 | ⚙️ | `eas.json` production | Test Paystack key (see #6); `buildType: "apk"` (Play Store needs AAB); submit block has placeholder `ascAppId: "1234567890"`, `appleTeamId: "TEAMID1234"`. |
| 36 | ⚙️ | `eas.json` production env | Missing `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` (preview/device have it). Benign today only because `CloudinaryImage.tsx:11` hardcodes the fallback `'duirkgqop'`. |
| 37 | ⚙️ | `app/_layout.tsx:159` | Paystack provider falls back to `"pk_test_placeholder"` when env is missing — silent test-mode instead of failing loudly. |

## 8. Server-side gaps behind the fake UIs

These are why the screens above are mocked — closing them unblocks the real implementations:

- No change-password passthrough usable with Bearer tokens (add better-auth `bearer()` plugin or a Nest endpoint).
- No vendor PIN change / forgot-PIN endpoints; PIN not enforced on vendor/dispatcher earnings withdrawals.
- No 2FA (better-auth `twoFactor` plugin not installed).
- No device/session listing or remote-logout endpoints.
- No notification-preferences model/endpoints (breaks both vendor mobile and admin screens).
- No reel comments endpoints; reels store image URLs, no video upload/streaming pipeline.
- Withdrawal `destination` accepted as free text rather than a linked, verified payment-method id (vendor flow should use `vendor/payment-methods`, which already exists and works).
- Customer/dispatcher real phone numbers not exposed on job/order payloads for the Call buttons.

## Verified working (spot-checked, no action needed)

Checkout & order creation, cart, Paystack card add/verify (`usePaystack` + `useVerifyAndSaveCard`), wallet top-up/transfer/bank-momo linking (with real account resolution), customer payment methods, referrals, support tickets (customer side), service booking, book-rider → track-order, vendor products/food/services CRUD, vendor coupons/promotions, vendor hours/staff/documents, vendor shop profile, dispatcher earnings/tasks, chat (customer/vendor/dispatcher), notifications feed, flash sales, wishlist/collections, admin dashboard + all list/detail/moderation pages.
