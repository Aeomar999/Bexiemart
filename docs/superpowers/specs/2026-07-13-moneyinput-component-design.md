# MoneyInput — reusable amount field

**Date:** 2026-07-13
**Status:** Approved design, pre-implementation
**Prototype:** https://claude.ai/code/artifact/798db2b7-06a1-4660-9a51-0aa998610837

## Problem

Every money screen hand-rolls its own "GHS 0.00" amount field. The pattern is
copy-pasted across at least five screens and drifts each time:

- `apps/mobile/app/(customer)/wallet/topup.tsx` — inline styles, no border, quick-amount chips, blue active tint
- `apps/mobile/app/(customer)/wallet/transfer.tsx` — NativeWind classes, bordered field, red "Insufficient balance" state
- `apps/mobile/app/(customer)/wallet/request.tsx` — third variation
- `apps/mobile/app/(vendor)/(earnings)/withdraw.tsx` — adds a flat-fee/total calc, hardcoded `availableBalance`
- dispatcher withdraw — same shape again

Every copy parses with `parseFloat`, so money math runs on floats — a correctness
smell for a payments app. There is no shared component and no shared money util.

## Goal

One reusable `MoneyInput` component plus a tested `money.ts` util, adopted across
all five mobile money screens (customer, vendor, dispatcher roles). The Next.js
admin mirror is explicitly out of scope for this pass.

## Decisions (settled during brainstorming)

1. **Number model — GHS major, integer-safe inside.** The public `value` is a
   `number` in GHS major units (e.g. `12.5`), matching the Prisma `Decimal` API
   1:1 (`minTopup 5.00`, `withdrawalFeeFlat 2.00`). No conversion at the network
   boundary. All parsing and rounding runs through `money.ts`, which works in
   integer pesewas internally (×100 → round → ÷100) so no `parseFloat` drift
   reaches the screen.
2. **Scope — mobile only.** One RN component + `money.ts` + migrate the 5 screens.
   Admin twin deferred to a follow-up.
3. **Component boundary — fat all-in-one.** `MoneyInput` owns the quick-amount
   chips, the balance/insufficient-balance error, and the fee/total breakdown,
   driven by props. Screens stop re-implementing these.
4. **Display mode — included.** `mode="display"` renders a read-only formatted
   amount for balances, transaction lists, and order totals.
5. **Canonical active color — brand navy.** Active chips, selection, and focus use
   brand navy (`#06406b` light / `#5193c6` dark), replacing Top Up's stray blue
   (`#1d4ed8`). One accent across all money screens.

## `money.ts` util

`apps/mobile/src/lib/money.ts` — pure, integer-only, fully unit-tested.

| Fn | Signature | Notes |
|----|-----------|-------|
| `toMinor` | `(major: string \| number) => number` | Parse a typed string or number to integer pesewas. `"12.5" → 1250`. |
| `toMajor` | `(minor: number) => number` | `1250 → 12.5`. |
| `formatMoney` | `(major: number, currency?: string) => string` | Grouped, 2dp, e.g. `"GHS 1,250.00"`. `currency` default `"GHS"`. |
| `sanitizeInput` | `(raw: string) => string` | Strip non-numeric, one dot, max 2 decimals, strip leading zeros. Mirrors what the keyboard should allow. |
| `clampMoney` | `(major: number, min?: number, max?: number) => number` | Bound a value to `[min, max]` in major units. |

All rounding is integer math on pesewas. `formatMoney` groups thousands
(`en-US`/`en-GH` style comma) and always shows exactly two decimals.

## Component API

`apps/mobile/src/components/ui/MoneyInput.tsx` — follows existing `ui/` conventions
(NativeWind classes, tokens from `@/theme/tokens`, flat design: borders not shadows).

| Prop | Type | Behavior |
|------|------|----------|
| `value` | `number` | Amount in GHS major units. |
| `onChangeValue` | `(v: number) => void` | Fires on every valid edit with the parsed major-unit number. |
| `currency` | `string?` (default `"GHS"`) | Rendered prefix — never hard-coded in JSX. |
| `balance` | `number?` | When set, shows inline "Insufficient balance" once `value > balance`, and surfaces the error state to the parent. |
| `quickAmounts` | `number[]?` | Optional chip row (major units). Tapping a chip sets the value. |
| `feeCalc` | `(v: number) => number?` | When set, renders the Amount / Fee / Total breakdown. |
| `mode` | `"input" \| "display"` (default `"input"`) | `display` renders a read-only formatted amount, no input. |
| `size` | `"lg" \| "md"` (default `"lg"`) | Hero amount vs compact inline. |
| `min` / `max` | `number?` | Validation floor / hard input cap in major units. |
| `editable` | `boolean?` (default `true`) | Non-editable renders a muted, read-only affordance. |
| `autoFocus` | `boolean?` | Focus on mount. |
| `label` | `string?` | Field label above the input. |
| `error` | `string?` | External error overrides the internal insufficient-balance one. |
| `testID` | `string?` | For tests. |

### Behavior

- Numeric keyboard (`keyboardType="numeric"`), max 2 decimals, rejects a third
  decimal and non-numeric characters via `sanitizeInput`.
- Emits major-unit `number` on every valid change; internal math in pesewas.
- Placeholder `"0.00"` in the muted/disabled token when empty.
- Error state = red border + message row; the message row height is reserved so
  layout doesn't jump between valid/invalid.
- `feeCalc` present → Amount / Fee / Total rows below the field.
- Accessible: `accessibilityLabel` on the field, chips are ≥44px hit targets with
  `aria`/RN-selected state, amount announced.

### States (from the prototype)

Empty · Filled · Quick-amount selected · Insufficient balance · Fee/total
breakdown · Read-only display · Disabled — all rendered from the single component.

## Call-site migration (5 screens)

Replace each bespoke amount block; preserve each screen's existing quick-amounts,
fee, balance, and PIN flow — only the input block and its local state change.
Convert each screen's `amount` state from a float string to the major-unit number
that `MoneyInput` emits.

- `wallet/topup.tsx` — `quickAmounts={[50,100,200,500,1000]}`, no balance, `size="lg"`.
- `wallet/transfer.tsx` — `balance={walletBalance}`, insufficient state via prop.
- `wallet/request.tsx` — plain input.
- `(vendor)/(earnings)/withdraw.tsx` — `balance` + `feeCalc={() => 5}` (flat fee).
- dispatcher withdraw — same as vendor.

Network payloads are unchanged: the API already speaks GHS majors, and `value` is
already a GHS major number, so migration touches UI + local state only.

## Testing

- `money.ts` — unit tests for parse/format/round edge cases: `"0.1"+"0.2"` style
  drift, trailing/leading zeros, 3-decimal rejection, grouping, negative/zero,
  clamp bounds.
- `MoneyInput.test.tsx` — renders each state; typing emits the right major-unit
  number; insufficient-balance threshold; chip selection; display mode is
  read-only; disabled blocks input; external `error` overrides internal.
- Each migrated screen keeps passing its existing tests.
- `scripts/check-design-system.mjs` must not gain violations.

## Out of scope

- Next.js admin twin (follow-up, contract-matched mirror sharing `money.ts` logic).
- Migrating read-only `GHS ${x.toFixed(2)}` display sites beyond the 5 input
  screens (the `display` mode exists for them, adoption is later).
- Multi-currency. `currency` is a prop but only `"GHS"` is used now.

## Files

- `apps/mobile/src/lib/money.ts` (new) + `money.test.ts` (new)
- `apps/mobile/src/components/ui/MoneyInput.tsx` (new) + `MoneyInput.test.tsx` (new)
- 5 screen edits listed above.
