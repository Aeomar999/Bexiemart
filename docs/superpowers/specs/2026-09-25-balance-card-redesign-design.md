# Balance Card Redesign — one honest card across every role

**Date:** 2026-09-25
**Status:** Approved design, pre-implementation
**Direction:** B — light surface card with an available/held split bar

## Problem

Every money screen hand-builds its own balance card. There are five copies and
no shared component, and they drift in look, formatting and honesty:

| Surface | File | Problems |
|---|---|---|
| Customer wallet hero | `apps/mobile/app/(customer)/wallet/index.tsx` | Off-brand purple gradient (`#4f2ae8`); decorative stacked linked-card layers push the balance down (196px block); shows `0.00` while loading; refresh button duplicates pull-to-refresh; rainbow quick-action colours (`#7c3aed`, `#e11d48`, `#059669`) |
| Vendor dashboard hero | `apps/mobile/app/(vendor)/(dashboard)/index.tsx` | Shows `0.00` while loading; no hide toggle |
| Vendor earnings hero | `apps/mobile/app/(vendor)/(earnings)/index.tsx` | "GHS" and "GH₵" mixed in one card; `.toFixed(2)` with no thousands separators; error state has no retry; withdraw button not pill |
| Rider earnings hero | `apps/mobile/app/(dispatcher)/(tabs)/(earnings)/index.tsx` | Near-copy of vendor card; withdraw is an unlabelled icon circle (no `accessibilityLabel`) |
| Rider home status pill | `apps/mobile/app/(dispatcher)/(tabs)/(home)/index.tsx:513` | Hardcoded `GH₵ 84.00 today · 6 trips` |
| Rider withdraw | `apps/mobile/app/(dispatcher)/(tabs)/(earnings)/withdraw.tsx:44` | "Available" reads `pendingClearance`, but the server enforces withdrawals against `wallet.balance` |
| Admin user wallet | `apps/admin/src/app/(dashboard)/users/[id]/page.tsx:99` | "Total Escrow (Locked)" reads `wallet.lockedBalance`, which does not exist in the schema — always `GHS 0.00` |
| Admin dispatcher | `apps/admin/src/app/(dashboard)/dispatchers/[id]/page.tsx:156` | Plain stat text; no wallet balance |

Data problems behind the cards:

- **Vendor "Pending clearance" is always 0.** `VendorService.getEarnings` returns
  `VendorProfile.pendingPayout`, which no code path ever writes. Real pending
  vendor money lives in `Escrow` rows (`vendorId`, `status = HELD`), released as
  `netAmount` into the vendor wallet by `EscrowService.release`.
- **Customer held money is never exposed.** Money a customer has paid into escrow
  for undelivered orders (`Escrow.buyerWalletId`, `status = HELD`) is invisible.
- **Rider pending is real.** `DeliveryService` increments
  `DispatcherProfile.pendingPayout` on delivery and moves it to `wallet.balance`
  on customer confirmation.

Every card also uses off-scale values (`text-[44px]`, `rounded-[20px]`,
`text-[11px]`) that violate `docs/DESIGN-SYSTEM.md`, and none uses the tested
`formatMoney` in `apps/mobile/src/lib/money.ts`.

## Goal

One `BalanceCard` component on mobile and a mirrored one on admin, adopted by
every balance surface, showing numbers that are correct, formatted the same way
everywhere, and clear about what is withdrawable versus held.

**Optimisation priority (user-chosen): trust & clarity.** When goals conflict,
correct and legible numbers win over visual impact.

## Decisions (settled during brainstorming)

1. **Visual direction — B, light surface.** White `bg-card` surface, 1px
   `border-border`, radius `2xl`, balance number in `text-primary` (navy). No
   gradients, no shadows. Chosen over a solid-navy card (A) and a navy band with
   white breakdown (C).
2. **Split bar is real for every role.** Server gains read-only aggregates so the
   second number is true. No money-moving code changes.
3. **Architecture — one component per platform, shared contract.** Per
   `DESIGN-SYSTEM.md` §0: identical props vocabulary and visual result, separate
   RN and web implementations. Not per-screen restyles (reintroduces drift), not
   a cross-platform package (RN/web cannot share JSX; format logic already lives
   in `money.ts`).
4. **BexieCoins card keeps its current UI.** The amber coins strip on the wallet
   screen and the amber hero on `wallet/rewards.tsx` keep their existing visual
   design and are **not** migrated to `BalanceCard`. The only change to them is
   removing the fabricated "Gold tier" wording (see §Honesty fixes) — there is no
   tier concept anywhere on the server.
5. **Currency format — `formatMoney`.** Every amount renders as
   `GHS 12,480.50` (grouped, 2dp). The currency code is rendered smaller than the
   number. `GH₵` is dropped from mobile balance surfaces.
6. **Disputed escrow is excluded from "held/pending".** Only `status = HELD`
   counts. Disputed money is surfaced by the disputes flow, not the card.

## Mobile component — `apps/mobile/src/components/ui/BalanceCard.tsx`

### Props

```ts
export interface BalanceCardProps {
  label: string;                         // "Wallet balance" | "Available to withdraw"
  available: number;                     // GHS major units
  held?: {
    label: string;                       // "On hold for orders" | "Pending clearance"
    amount: number;                      // GHS major units
    info: string;                        // one-line explanation shown by the ⓘ toggle
  };
  action?: {
    title: string;                       // "Top up" | "Withdraw"
    icon: string;                        // Icon name
    onPress: () => void;
  };
  onPress?: () => void;                  // whole-card press (compact dashboard use)
  pressHint?: string;                    // trailing link text in compact size, e.g. "View earnings"
  status?: "loading" | "error" | "ready"; // default "ready"
  onRetry?: () => void;                  // required when status can be "error"
  size?: "md" | "sm";                    // default "md"
  testID?: string;
}
```

### Anatomy (size `md`)

1. **Header row** — `label` in `caption` / `text-foreground-secondary` (new
   Tailwind alias for `--color-text-secondary`; muted grey fails WCAG AA on
   white), eye toggle on
   the right (44×44 hit area via `hitSlop`).
2. **Amount** — currency code in `body-lg` bold + number in `display-lg`
   `font-heading font-black text-primary`, `fontVariant: ["tabular-nums"]`.
3. **Split bar** *(only when `held` is passed)* — 6px track, two segments with a
   2px gap: available in `primary`, held in `money-held` (see
   Design-system conformance). Segment widths are proportional to
   `available : held`. When both are 0 the track renders as one empty
   `border`-coloured segment.
4. **Legend rows** *(only when `held` is passed)* — two rows separated by a
   hairline: `● Available  GHS x` and `● {held.label} ⓘ  GHS y`. Tapping ⓘ
   toggles `held.info` inline beneath the row in a `primarySubtle` box. No modal.
5. **Primary action** *(only when `action` is passed)* — full-width pill,
   `Button` variant `primary`, size `md` (48px), with leading icon.

### Size `sm` (compact, for dashboards)

Header row + amount (`display-md`) + split bar + a single line
`{held.label}  GHS y` + optional `pressHint` link with chevron. No legend dot rows,
no ⓘ, no action pill. The whole card is pressable via `onPress`.

### States

| State | Rendering |
|---|---|
| `loading` | Card shell and header label stay; amount, bar, rows and pill are replaced by `Skeleton` blocks of the same size. **Never renders `0.00`.** Eye toggle still works. |
| `error` | Card shell and header label stay; body shows an `alert-circle` icon in `error`, "Couldn't load your balance", helper "Your money is safe. Check your connection and try again.", and an outline `Retry` pill calling `onRetry`. **No numbers rendered.** |
| `ready`, hidden | Amount renders `GHS ••••••`; legend/compact values render `GHS ••••`; split bar renders as one neutral segment (no proportions). |
| `ready`, zero | `GHS 0.00` with an empty track. |

### Hide-balance preference — `apps/mobile/src/lib/stores/balance-visibility-store.ts`

Zustand + `persist` + AsyncStorage (same pattern as `wallet-store.ts`):
`{ hidden: boolean; toggle: () => void }`, storage key
`bexiemart-balance-visibility`, default `hidden: false`. One device-wide
preference read by every `BalanceCard` and by the rider home pill. Replaces the
customer wallet's local `showBalance` state.

### Accessibility

- Card container has one `accessibilityLabel` sentence, e.g.
  `"Available to withdraw, GHS 12,480.50. Pending clearance, GHS 2,150.00."`;
  hidden → `"Available to withdraw, hidden."`; loading → `"Loading balance"`.
- Eye toggle: `accessibilityRole="button"`, label `"Show balances"` /
  `"Hide balances"`.
- ⓘ toggle: `accessibilityRole="button"`, label `"What is {held.label}?"`,
  `accessibilityState={{ expanded }}`.
- All tap targets ≥ 44×44.

### Design-system conformance

Semantic NativeWind tokens only (`bg-card`, `border-border`, `text-foreground`,
`text-muted-foreground`, `text-primary`, `bg-primary-subtle`) so the card works
when the dark-mode flag is enabled. Type from the named scale only. No arbitrary
`[...]` values, no `shadow-*`/`elevation`. The one non-semantic colour — the held
segment — is added as a Layer-2 semantic token rather than inlined:
`--color-money-held` in `apps/mobile/global.css` (light `var(--brand-300)`,
dark `var(--brand-600)`), exposed as the Tailwind colour `money-held`, and
mirrored as `tokens.moneyHeld` in `src/theme/tokens.ts` for style props. The now-unused `moneyGrad1` /
`moneyGrad2` tokens stay until every consumer (`orders.tsx`, `track-order.tsx`)
is migrated; removing them is out of scope.

## Surface mapping (mobile)

| Surface | `label` | `available` | `held` | `action` / size |
|---|---|---|---|---|
| Customer wallet `wallet/index.tsx` | Wallet balance | `wallet.balance` | "On hold for orders" = `wallet.heldInEscrow` · info: "Paid for orders that haven't been delivered yet. Released to the seller on delivery, or refunded here if cancelled." | Top up → `/(customer)/wallet/topup`, `md` |
| Vendor earnings `(earnings)/index.tsx` | Available to withdraw | `earnings.availableBalance` | "Pending clearance" = `earnings.pendingClearance` · info: "From orders still in escrow. Moves to Available when the buyer confirms delivery." | Withdraw → `/(vendor)/(earnings)/withdraw`, `md` |
| Vendor dashboard `(dashboard)/index.tsx` | Available to withdraw | same | same | `sm`, `onPress` → `/(vendor)/(earnings)`, `pressHint` "View earnings" |
| Rider earnings `(earnings)/index.tsx` | Available to withdraw | `earnings.availableBalance` | "Pending clearance" = `earnings.pendingClearance` · info: "From deliveries awaiting customer confirmation." | Withdraw → `/(dispatcher)/(tabs)/(earnings)/withdraw`, `md` |

### Screen-level changes around the card

- **Customer wallet:** remove the stacked linked-card layers (Layers 1–2), the
  in-card refresh button (pull-to-refresh remains) and the in-card "Link account"
  pill. Top up moves into the card. The quick-action row becomes
  **Send · Request · Cards · Link account** with navy tints
  (`bg-primary-subtle` circle, `primary` icon) replacing the rainbow colours.
  The BexieCoins strip below is unchanged except for the copy fix.
- **Vendor & rider earnings:** "Today" and "This week" move out of the card into
  two outlined stat tiles (radius `xl`, `EarningsStatTiles` component) directly
  below it; each tile pushes to the role's `analytics` route, and the tiles
  respect the hide preference (they show the same "today" figure as the rider
  home pill). Error state uses the
  card's `error` status with `onRetry` = the query's `refetch`, replacing the bare
  "Failed to load earnings" text. The full-screen `RowsSkeleton` is replaced by
  the card's `loading` status plus skeleton tiles.
- **Rider home status pill:** `GH₵ 84.00 today · 6 trips` becomes
  `formatMoney(earnings.todayRevenue) + " today"` from `useDispatcherEarnings()`.
  Trip count is dropped (no data source). Hidden preference → `GHS •••• today`.
  While loading or on error, the second line is omitted (status line only).
- **Rider withdraw:** `availableBalance` reads `earnings.availableBalance`
  (was `earnings.pendingClearance`). Its "Available:" line uses `formatMoney`.
- **Vendor withdraw:** "Available:" line uses `formatMoney`.

## Admin component — `apps/admin/src/components/ui/BalanceCard.tsx`

Web mirror of the contract, read-only: `label`, `available`, optional `held`
(`label`, `amount`), optional `footnote`. Same anatomy as mobile `md` minus the
eye toggle, ⓘ toggle and action (admins always see figures; info text is shown
as the row's `title` tooltip). Uses the admin CSS vars that exist today
(`--color-card`, `--color-border`, `--color-primary`, `--color-text`,
`--color-text-secondary`, `--color-text-muted`) plus a new
`--color-money-held`; radius `2xl`, flat.
Formats via a new `apps/admin/src/lib/money.ts#formatMoney` mirroring mobile
output (`GHS 1,250.00`); the existing admin `formatCurrency` is untouched.

| Page | `available` | `held` | `footnote` |
|---|---|---|---|
| `users/[id]` "Wallet" | `user.wallet.balance` | "Held in escrow" = `user.wallet.heldInEscrow` | When the user has a vendor profile: "Vendor pending clearance: GHS x" from `user.vendorPendingClearance` (one wallet per user, so no second card) |
| `dispatchers/[id]` "Wallet" | `dispatcher.walletBalance` | "Pending payout" = `dispatcher.pendingPayout` | "Lifetime earnings GHS x" from `totalEarnings` |

The "Total Escrow (Locked)" row reading the non-existent `lockedBalance` is removed.

## Server changes (read-only aggregates)

No change to any code that moves money. All new numbers are `Number(...)` of a
Prisma `_sum`, defaulting to 0.

1. **`VendorService.getEarnings`** (`apps/server/src/modules/vendor/vendor.service.ts`):
   `pendingClearance` = `escrow.aggregate({ where: { vendorId: profile.id, status: "HELD" }, _sum: { netAmount: true } })`.
   Stops reading `VendorProfile.pendingPayout` (column stays; dropping it is a
   separate migration, out of scope).
2. **Customer wallet** (`GET /wallet`): response gains
   `heldInEscrow` = `escrow.aggregate({ where: { buyerWalletId: wallet.id, status: "HELD" }, _sum: { amount: true } })`.
   **Sequencing:** background task `task_5f1292e8` is reshaping this response to
   stop leaking `pinHash` / `user.password`. This change lands **after** that
   task merges and adds the field to its sanitized shape.
3. **`AdminService.getUser`**: adds `wallet.heldInEscrow` (same aggregate) and,
   when `vendorProfile` exists, `vendorPendingClearance` (vendor aggregate).
4. **`AdminService.getDispatcher`**: adds `walletBalance` from the dispatcher
   user's wallet (0 when none).

Mobile types (`use-wallet.ts`, vendor/dispatcher earnings) gain the new optional
fields; screens treat a missing `heldInEscrow` as 0 so the card works against an
older server.

## Honesty fixes bundled in

| Fix | Where |
|---|---|
| Rider withdraw "Available" reads the wrong field | `(dispatcher)/(tabs)/(earnings)/withdraw.tsx:44` |
| Rider home fake `GH₵ 84.00 today · 6 trips` | `(dispatcher)/(tabs)/(home)/index.tsx:513` |
| Vendor pending always 0 | server §1 |
| Admin "Locked" always 0 | `users/[id]/page.tsx` + server §3 |
| Fabricated "Gold tier" | `wallet/index.tsx:311` "Gold tier · BexieCoins" → "BexieCoins"; `wallet/rewards.tsx:135` "Gold Tier Member" line removed. Visual design of both coins cards otherwise unchanged. |

## Testing

- **`BalanceCard.test.tsx`** (mobile): formats amounts via `formatMoney`
  (thousands separators, 2dp); split bar renders only with `held` and segment
  flex ratio matches `available:held`; zero/zero renders empty track; hidden mode
  masks every amount and neutralises the bar; `loading` renders skeletons and no
  `0.00` text; `error` renders message + Retry and calls `onRetry`, no amounts;
  ⓘ toggles info and `accessibilityState.expanded`; container
  `accessibilityLabel` sentences for ready/hidden/loading; `sm` size omits legend
  rows and action; `action.onPress` fires.
- **`balance-visibility-store.test.ts`**: default visible, toggle flips, persisted
  key.
- **Screen tests:** update `(vendor)/(earnings)/withdraw.test.tsx`; add rider
  withdraw test asserting "Available" uses `availableBalance`; keep
  `rewards.test.tsx` `coins-balance` testID passing and assert "Gold Tier" text is
  gone.
- **Server:** `vendor.service.spec.ts` — `pendingClearance` equals the HELD
  escrow `netAmount` sum and ignores RELEASED/REFUNDED/DISPUTED;
  wallet service — `heldInEscrow` sums only HELD rows for that buyer wallet;
  admin service — `getUser` / `getDispatcher` new fields.
- **Admin:** `BalanceCard.test.tsx` (jest + jsdom): renders formatted amounts,
  bar only with `held`, footnote.
- **Design system:** `npm run lint:ds` reports no new violations in touched files.

## Out of scope

- Transaction lists, analytics screens, checkout's wallet-balance row.
- Visual redesign of the BexieCoins strip and rewards hero (decision 4).
- Enabling the dark-mode flag.
- Showing disputed escrow on the card.
- Dropping the unused `VendorProfile.pendingPayout` column and the `moneyGrad*`
  tokens.
- Changing admin's global `formatCurrency`.
