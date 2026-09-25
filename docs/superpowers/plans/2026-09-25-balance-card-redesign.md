# Balance Card Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace five hand-rolled balance cards with one honest `BalanceCard` (mobile) plus a mirrored admin card, backed by real "held/pending" numbers from the server.

**Architecture:** A flat, light-surface `BalanceCard` React Native component reads a device-wide hide preference (zustand + AsyncStorage) and renders available vs held money with a proportional split bar, plus explicit loading and error states. Screens pass role-specific props. The server adds read-only escrow aggregates so every role's held number is real. Admin gets a web mirror of the same contract.

**Tech Stack:** Expo / React Native + NativeWind, zustand, @tanstack/react-query, jest-expo + @testing-library/react-native (mobile); Next.js + Tailwind v4, jest + @testing-library/react (admin); NestJS + Prisma, jest (server).

**Spec:** `docs/superpowers/specs/2026-09-25-balance-card-redesign-design.md`
**Branch:** `feat/balance-card-redesign` (already created; spec committed as `a5192fa`)

## Global Constraints

- Money renders only via `formatMoney` (mobile `apps/mobile/src/lib/money.ts`, admin mirror `apps/admin/src/lib/money.ts`): `GHS 12,480.50` — grouped, exactly 2dp. No `GH₵` on any surface this plan touches.
- Hidden amounts: main number `••••••`, every other amount `GHS ••••`.
- **Never render `0.00` while loading.** Error states render **no** amounts.
- Held/pending counts only escrow rows with `status: "HELD"` (disputed excluded).
- No change to any code path that moves money. Server changes are read-only `aggregate` calls.
- Design system (`docs/DESIGN-SYSTEM.md`) for **new or changed code**: semantic tokens only; no raw hex outside token files; no arbitrary `[...]` Tailwind values; no `shadow-*` / `elevation`; type from the named scale; buttons are the shared `Button` (pill). Lines a task copies verbatim from the current file (screen headers, transaction lists, the BexieCoins strip) are exempt and stay untouched (user decision 2026-09-25).
- The Recent Transactions list duplicated between the vendor and rider Earnings screens is pre-existing and out of scope; do not extract it in this plan (user decision 2026-09-25).
- Tap targets ≥ 44×44 (use `hitSlop` of 12 on 14–18px icons).
- Copy strings are exact as written in this plan (`HELD_INFO`, labels, error text).
- BexieCoins strip (wallet) and rewards hero keep their current visual design; only the fabricated "Gold tier" wording is removed.
- Commit after every task on `feat/balance-card-redesign`. Do not push.
- Mobile tests: `cd apps/mobile && npx jest <path>`. Admin: `cd apps/admin && npx jest <path>`. Server: `cd apps/server && npx jest <path>`. Quote paths containing parentheses.

## Plan-time refinements to the spec

Found while mapping the code; each keeps the spec's intent:

1. **Error icon:** `cloud-off` is not in the mobile `Icon` map; use `alert-circle`.
2. **Label contrast:** `text-muted-foreground` (#94A3B8) fails WCAG AA on white. Labels use a new Tailwind colour `foreground-secondary` → the existing `--color-text-secondary` CSS var.
3. **Withdraw icon bug:** `"arrow-up-right"` is not in the `Icon` map, so every current Withdraw button falls back to a map icon. Task 2 adds the alias.
4. **Hide preference also masks the Today / This week tiles**, which show the same today figure as the rider home pill.
5. **Admin tokens:** admin has no `--color-surface` / `--color-text-primary` yet; the admin card uses the vars that exist (`--color-card`, `--color-text`, `--color-text-secondary`, `--color-text-muted`, `--color-border`, `--color-primary`).
6. **Admin user page:** a user has one wallet, so vendor pending clearance renders as the card's footnote rather than a second card that repeats the same available figure.

## File Structure

| File | Responsibility |
|---|---|
| `apps/mobile/src/lib/stores/balance-visibility-store.ts` (new) | Device-wide persisted "hide balances" flag |
| `apps/mobile/src/lib/balance.ts` (new) | `displayMoney`, `MASKED_MONEY`, `HELD_INFO` copy |
| `apps/mobile/src/components/ui/BalanceCard.tsx` (new) | The card: amount, split bar, legend, ⓘ, action, loading/error/hidden |
| `apps/mobile/src/components/ui/EarningsStatTiles.tsx` (new) | Today / This week outlined tiles for vendor + rider earnings |
| `apps/mobile/global.css`, `tailwind.config.js`, `src/theme/tokens.ts` | `money-held` + `foreground-secondary` tokens |
| `apps/mobile/src/components/ui/Icon.tsx` | `arrow-up-right` alias |
| Mobile screens (6) | Adopt the card; honesty fixes |
| `apps/server/src/modules/vendor/vendor.service.ts` | Vendor pending = HELD escrow `netAmount` |
| `apps/server/src/modules/admin/admin.service.ts` | Admin user/dispatcher balance fields |
| `apps/server/src/modules/wallet/wallet.service.ts` + controller | Customer `heldInEscrow` (gated, Task 13) |
| `apps/admin/src/lib/money.ts` (new) | Admin `formatMoney` mirror |
| `apps/admin/src/components/ui/BalanceCard.tsx` (new) | Admin read-only card |
| Admin pages (2) | Adopt the admin card |

---

### Task 1: Balance foundations (visibility store + helpers)

**Files:**
- Create: `apps/mobile/src/lib/stores/balance-visibility-store.ts`
- Create: `apps/mobile/src/lib/balance.ts`
- Test: `apps/mobile/src/lib/stores/balance-visibility-store.test.ts`
- Test: `apps/mobile/src/lib/balance.test.ts`

**Interfaces:**
- Consumes: `formatMoney(major: number, currency?: string): string` from `@/lib/money`.
- Produces:
  - `useBalanceVisibility` — zustand hook, state `{ hidden: boolean; toggle: () => void }`.
  - `BALANCE_VISIBILITY_KEY = "bexiemart-balance-visibility"`.
  - `MASKED_MONEY = "GHS ••••"`.
  - `displayMoney(amount: number, hidden: boolean): string`.
  - `HELD_INFO: { customer: string; vendor: string; rider: string }`.

- [ ] **Step 1: Write the failing store test**

`apps/mobile/src/lib/stores/balance-visibility-store.test.ts`:

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { act } from "@testing-library/react-native";
import { useBalanceVisibility, BALANCE_VISIBILITY_KEY } from "./balance-visibility-store";

describe("balance-visibility-store", () => {
  beforeEach(() => {
    act(() => useBalanceVisibility.setState({ hidden: false }));
    jest.clearAllMocks();
  });

  it("defaults to visible", () => {
    expect(useBalanceVisibility.getState().hidden).toBe(false);
  });

  it("toggle flips hidden both ways", () => {
    act(() => useBalanceVisibility.getState().toggle());
    expect(useBalanceVisibility.getState().hidden).toBe(true);
    act(() => useBalanceVisibility.getState().toggle());
    expect(useBalanceVisibility.getState().hidden).toBe(false);
  });

  it("persists under the bexiemart-balance-visibility key", async () => {
    act(() => useBalanceVisibility.getState().toggle());
    await new Promise((r) => setTimeout(r, 0));
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      BALANCE_VISIBILITY_KEY,
      expect.stringContaining('"hidden":true')
    );
  });
});
```

- [ ] **Step 2: Write the failing helpers test**

`apps/mobile/src/lib/balance.test.ts`:

```ts
import { displayMoney, MASKED_MONEY, HELD_INFO } from "./balance";

describe("balance helpers", () => {
  it("formats visible amounts with formatMoney", () => {
    expect(displayMoney(12480.5, false)).toBe("GHS 12,480.50");
    expect(displayMoney(0, false)).toBe("GHS 0.00");
  });

  it("masks hidden amounts", () => {
    expect(MASKED_MONEY).toBe("GHS ••••");
    expect(displayMoney(12480.5, true)).toBe("GHS ••••");
  });

  it("has explanation copy for every role", () => {
    expect(Object.keys(HELD_INFO).sort()).toEqual(["customer", "rider", "vendor"]);
    expect(HELD_INFO.rider).toBe("From deliveries awaiting customer confirmation.");
  });
});
```

- [ ] **Step 3: Run both tests to verify they fail**

Run: `cd apps/mobile && npx jest src/lib/stores/balance-visibility-store.test.ts src/lib/balance.test.ts`
Expected: FAIL with "Cannot find module './balance-visibility-store'" and "Cannot find module './balance'".

- [ ] **Step 4: Implement the store**

`apps/mobile/src/lib/stores/balance-visibility-store.ts`:

```ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BALANCE_VISIBILITY_KEY = "bexiemart-balance-visibility";

interface BalanceVisibilityState {
  hidden: boolean;
  toggle: () => void;
}

// One device-wide preference: hiding balances on one screen hides them on
// every balance surface (wallet, earnings, dashboard, rider home pill).
export const useBalanceVisibility = create<BalanceVisibilityState>()(
  persist(
    (set) => ({
      hidden: false,
      toggle: () => set((s) => ({ hidden: !s.hidden })),
    }),
    {
      name: BALANCE_VISIBILITY_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ hidden: s.hidden }),
    }
  )
);
```

- [ ] **Step 5: Implement the helpers**

`apps/mobile/src/lib/balance.ts`:

```ts
import { formatMoney } from "@/lib/money";

export const MASKED_MONEY = "GHS ••••";

export function displayMoney(amount: number, hidden: boolean): string {
  return hidden ? MASKED_MONEY : formatMoney(amount);
}

// One-line explanations shown by the ⓘ toggle on each role's held amount.
export const HELD_INFO = {
  customer:
    "Paid for orders that haven't been delivered yet. Released to the seller on delivery, or refunded here if cancelled.",
  vendor: "From orders still in escrow. Moves to Available when the buyer confirms delivery.",
  rider: "From deliveries awaiting customer confirmation.",
} as const;
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd apps/mobile && npx jest src/lib/stores/balance-visibility-store.test.ts src/lib/balance.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/lib/stores/balance-visibility-store.ts apps/mobile/src/lib/stores/balance-visibility-store.test.ts apps/mobile/src/lib/balance.ts apps/mobile/src/lib/balance.test.ts
git commit -m "feat(mobile): add balance visibility store and balance display helpers"
```

---

### Task 2: `BalanceCard` component (+ tokens, icon alias)

**Files:**
- Create: `apps/mobile/src/components/ui/BalanceCard.tsx`
- Test: `apps/mobile/src/components/ui/BalanceCard.test.tsx`
- Modify: `apps/mobile/global.css` (3 insertions)
- Modify: `apps/mobile/tailwind.config.js` (colors block, after `"muted-foreground"`)
- Modify: `apps/mobile/src/theme/tokens.ts` (`lightTokens`, `darkTokens`)
- Modify: `apps/mobile/src/components/ui/Icon.tsx` (iconMap)
- Modify: `apps/mobile/src/components/ui/Icon.test.tsx`

**Interfaces:**
- Consumes: `useBalanceVisibility`, `displayMoney` (Task 1); `formatMoney`; `Button` (`title`, `variant`, `size`, `leftIcon`, `testID`, `onPress`); `Skeleton` (`width`, `height`, `borderRadius`, `style`); `Icon` (`name`, `size`, `color`); `useThemeColors()` → `{ primary, primaryText, textSecondary, error, ... }`.
- Produces:

```ts
export interface BalanceCardProps {
  label: string;
  available: number;
  held?: { label: string; amount: number; info: string };
  action?: { title: string; icon: string; onPress: () => void };
  onPress?: () => void;
  pressHint?: string;
  status?: "loading" | "error" | "ready";
  onRetry?: () => void;
  size?: "md" | "sm";
  testID?: string; // default "balance-card"
}
export function BalanceCard(props: BalanceCardProps): JSX.Element;
```

  testIDs (with default prefix `balance-card`): `-amount`, `-summary`, `-toggle`, `-bar-available`, `-bar-held`, `-bar-empty`, `-info`, `-action`, `-hint`, `-loading`, `-error`, `-retry`.
  Tailwind colours: `bg-money-held`, `text-foreground-secondary`.

- [ ] **Step 1: Write the failing icon test**

Append inside the `describe("Icon", ...)` block in `apps/mobile/src/components/ui/Icon.test.tsx`:

```tsx
  it("maps arrow-up-right to the up-right arrow, not the fallback", () => {
    const upRight = render(<Icon name="arrow-up-right" />).toJSON();
    const trendingUp = render(<Icon name="trending-up" />).toJSON();
    const fallback = render(<Icon name="apps" />).toJSON();
    expect(upRight).toEqual(trendingUp);
    expect(upRight).not.toEqual(fallback);
  });
```

- [ ] **Step 2: Write the failing BalanceCard test**

`apps/mobile/src/components/ui/BalanceCard.test.tsx`:

```tsx
import React from "react";
import { StyleSheet } from "react-native";
import { render, fireEvent, act } from "@testing-library/react-native";
import { BalanceCard } from "./BalanceCard";
import { useBalanceVisibility } from "@/lib/stores/balance-visibility-store";

const held = { label: "Pending clearance", amount: 2150, info: "From orders still in escrow." };
const flat = (el: any) => StyleSheet.flatten(el.props.style);

describe("BalanceCard", () => {
  beforeEach(() => {
    act(() => useBalanceVisibility.setState({ hidden: false }));
  });

  it("formats the available amount with grouping and two decimals", () => {
    const { getByTestId } = render(<BalanceCard label="Available to withdraw" available={12480.5} />);
    expect(getByTestId("balance-card-amount").props.children).toBe("12,480.50");
  });

  it("renders no split bar or legend without held", () => {
    const { queryByTestId, queryByText } = render(<BalanceCard label="Wallet balance" available={50} />);
    expect(queryByTestId("balance-card-bar-available")).toBeNull();
    expect(queryByTestId("balance-card-bar-empty")).toBeNull();
    expect(queryByText("Available")).toBeNull();
  });

  it("sizes bar segments in proportion to available and held", () => {
    const { getByTestId } = render(
      <BalanceCard label="Available to withdraw" available={12480.5} held={held} />
    );
    expect(flat(getByTestId("balance-card-bar-available"))).toMatchObject({ flex: 12480.5 });
    expect(flat(getByTestId("balance-card-bar-held"))).toMatchObject({ flex: 2150 });
  });

  it("renders an empty track and 0.00 when both amounts are zero", () => {
    const { getByTestId } = render(
      <BalanceCard label="Available to withdraw" available={0} held={{ ...held, amount: 0 }} />
    );
    expect(getByTestId("balance-card-bar-empty")).toBeTruthy();
    expect(getByTestId("balance-card-amount").props.children).toBe("0.00");
  });

  it("shows legend rows with formatted values", () => {
    const { getByText } = render(<BalanceCard label="x" available={12480.5} held={held} />);
    expect(getByText("Available")).toBeTruthy();
    expect(getByText("GHS 12,480.50")).toBeTruthy();
    expect(getByText("Pending clearance")).toBeTruthy();
    expect(getByText("GHS 2,150.00")).toBeTruthy();
  });

  it("masks every amount and neutralises the bar when hidden", () => {
    act(() => useBalanceVisibility.setState({ hidden: true }));
    const { getByTestId, getAllByText, queryByText, queryByTestId } = render(
      <BalanceCard label="x" available={12480.5} held={held} />
    );
    expect(getByTestId("balance-card-amount").props.children).toBe("••••••");
    expect(getAllByText("GHS ••••")).toHaveLength(2);
    expect(queryByText(/12,480/)).toBeNull();
    expect(queryByText(/2,150/)).toBeNull();
    expect(getByTestId("balance-card-bar-empty")).toBeTruthy();
    expect(queryByTestId("balance-card-bar-held")).toBeNull();
  });

  it("toggles the shared hidden preference from the eye button", () => {
    const { getByLabelText } = render(<BalanceCard label="x" available={1} />);
    fireEvent.press(getByLabelText("Hide balances"));
    expect(useBalanceVisibility.getState().hidden).toBe(true);
    expect(getByLabelText("Show balances")).toBeTruthy();
  });

  it("renders skeletons and never 0.00 while loading", () => {
    const { getByTestId, getByLabelText, queryByText } = render(
      <BalanceCard
        label="x"
        available={0}
        held={held}
        action={{ title: "Withdraw", icon: "arrow-up-right", onPress: jest.fn() }}
        status="loading"
      />
    );
    expect(getByTestId("balance-card-loading")).toBeTruthy();
    expect(getByLabelText("Loading balance")).toBeTruthy();
    expect(queryByText(/0\.00/)).toBeNull();
    expect(queryByText("Withdraw")).toBeNull();
  });

  it("renders the error message and Retry without amounts", () => {
    const onRetry = jest.fn();
    const { getByText, queryByText, getByTestId } = render(
      <BalanceCard label="x" available={500} held={held} status="error" onRetry={onRetry} />
    );
    expect(getByText("Couldn't load your balance")).toBeTruthy();
    expect(queryByText(/500/)).toBeNull();
    fireEvent.press(getByTestId("balance-card-retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("toggles the held explanation and reports expanded state", () => {
    const { getByLabelText, getByText, queryByText } = render(
      <BalanceCard label="x" available={1} held={held} />
    );
    expect(getByLabelText("What is Pending clearance?").props.accessibilityState).toMatchObject({
      expanded: false,
    });
    expect(queryByText("From orders still in escrow.")).toBeNull();
    fireEvent.press(getByLabelText("What is Pending clearance?"));
    expect(getByText("From orders still in escrow.")).toBeTruthy();
    expect(getByLabelText("What is Pending clearance?").props.accessibilityState).toMatchObject({
      expanded: true,
    });
  });

  it("exposes one summary sentence for screen readers", () => {
    const { getByLabelText, rerender } = render(
      <BalanceCard label="Available to withdraw" available={12480.5} held={held} />
    );
    expect(
      getByLabelText("Available to withdraw, GHS 12,480.50. Pending clearance, GHS 2,150.00.")
    ).toBeTruthy();
    act(() => useBalanceVisibility.setState({ hidden: true }));
    rerender(<BalanceCard label="Available to withdraw" available={12480.5} held={held} />);
    expect(getByLabelText("Available to withdraw, hidden.")).toBeTruthy();
  });

  it("fires the primary action", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <BalanceCard label="x" available={1} action={{ title: "Top up", icon: "plus", onPress }} />
    );
    fireEvent.press(getByText("Top up"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("compact size shows one held line and the press hint, no legend or action", () => {
    const onPress = jest.fn();
    const { getByText, queryByText, getByLabelText } = render(
      <BalanceCard
        label="x"
        available={100}
        held={held}
        size="sm"
        onPress={onPress}
        pressHint="View earnings"
        action={{ title: "Withdraw", icon: "arrow-up-right", onPress: jest.fn() }}
      />
    );
    expect(getByText("Pending clearance")).toBeTruthy();
    expect(getByText("GHS 2,150.00")).toBeTruthy();
    expect(queryByText("Available")).toBeNull();
    expect(queryByText("Withdraw")).toBeNull();
    fireEvent.press(getByLabelText("View earnings"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd apps/mobile && npx jest src/components/ui/BalanceCard.test.tsx src/components/ui/Icon.test.tsx`
Expected: FAIL. BalanceCard: "Cannot find module './BalanceCard'". Icon: the new test fails because `arrow-up-right` renders the fallback icon, so `expect(upRight).toEqual(trendingUp)` fails.

- [ ] **Step 4: Add the icon alias**

In `apps/mobile/src/components/ui/Icon.tsx`, inside `iconMap`, directly after the line `"trending-up": ArrowUpRight01Icon,` add:

```ts
  "arrow-up-right": ArrowUpRight01Icon,
```

(`ArrowUpRight01Icon` is already imported at the top of the file.)

- [ ] **Step 5: Add the tokens**

In `apps/mobile/global.css`:
- In the light `:root` block, directly after `    --color-primary-text: #ffffff;` (line 88), add:
  ```css
      --color-money-held: var(--brand-300);
  ```
- In the `@media (prefers-color-scheme: dark)` block, directly after its `--color-primary-text: #ffffff;` (line ~126), add:
  ```css
        --color-money-held: var(--brand-600);
  ```
- In the `.dark` block, directly after its `--color-primary-text: #ffffff;` (line ~153), add:
  ```css
      --color-money-held: var(--brand-600);
  ```

In `apps/mobile/tailwind.config.js`, in `theme.extend.colors`, directly after `"muted-foreground": "var(--color-text-muted)",` add:

```js
        "foreground-secondary": "var(--color-text-secondary)",
        "money-held": "var(--color-money-held)",
```

In `apps/mobile/src/theme/tokens.ts`:
- In `lightTokens`, directly after `moneyGrad1: "#04365b", // brand-800` add:
  ```ts
    moneyHeld: "#88b7da", // brand-300 — held/pending segment of the BalanceCard split bar
  ```
- In `darkTokens`, directly after its `moneyGrad1` line add:
  ```ts
    moneyHeld: "#1b5b8b", // brand-600
  ```

- [ ] **Step 6: Implement `BalanceCard`**

`apps/mobile/src/components/ui/BalanceCard.tsx`:

```tsx
import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatMoney } from "@/lib/money";
import { displayMoney } from "@/lib/balance";
import { useThemeColors } from "@/theme/useThemeColors";
import { useBalanceVisibility } from "@/lib/stores/balance-visibility-store";

export interface BalanceCardProps {
  label: string;
  available: number;
  held?: { label: string; amount: number; info: string };
  action?: { title: string; icon: string; onPress: () => void };
  onPress?: () => void;
  pressHint?: string;
  status?: "loading" | "error" | "ready";
  onRetry?: () => void;
  size?: "md" | "sm";
  testID?: string;
}

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };
const TABULAR = { fontVariant: ["tabular-nums" as const] };

function summaryLabel(
  label: string,
  available: number,
  held: BalanceCardProps["held"],
  hidden: boolean
): string {
  if (hidden) return `${label}, hidden.`;
  const main = `${label}, ${formatMoney(available)}.`;
  return held ? `${main} ${held.label}, ${formatMoney(held.amount)}.` : main;
}

function SplitBar({
  available,
  held,
  hidden,
  testID,
}: {
  available: number;
  held: number;
  hidden: boolean;
  testID: string;
}) {
  if (hidden || available + held <= 0) {
    return (
      <View testID={`${testID}-bar-empty`} className="rounded-full bg-border" style={{ height: 6 }} />
    );
  }
  return (
    <View className="flex-row gap-0.5" style={{ height: 6 }}>
      {available > 0 && (
        <View
          testID={`${testID}-bar-available`}
          className="rounded-full bg-primary"
          style={{ flex: available }}
        />
      )}
      {held > 0 && (
        <View
          testID={`${testID}-bar-held`}
          className="rounded-full bg-money-held"
          style={{ flex: held }}
        />
      )}
    </View>
  );
}

function LegendRow({
  dotClass,
  label,
  value,
  info,
}: {
  dotClass: string;
  label: string;
  value: string;
  info?: { open: boolean; onToggle: () => void; text: string; testID: string; color: string };
}) {
  return (
    <View className="py-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1">
          <View className={`w-2 h-2 rounded-full ${dotClass}`} />
          <Text className="text-body-sm font-body text-foreground-secondary">{label}</Text>
          {info && (
            <Pressable
              testID={`${info.testID}-info`}
              onPress={info.onToggle}
              hitSlop={HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel={`What is ${label}?`}
              accessibilityState={{ expanded: info.open }}
            >
              <Icon name="info" size={14} color={info.color} />
            </Pressable>
          )}
        </View>
        <Text className="text-body-sm font-body font-bold text-foreground" style={TABULAR}>
          {value}
        </Text>
      </View>
      {info?.open && (
        <View className="mt-2 rounded-lg bg-primary-subtle px-3 py-2">
          <Text className="text-body-sm font-body text-foreground">{info.text}</Text>
        </View>
      )}
    </View>
  );
}

export function BalanceCard({
  label,
  available,
  held,
  action,
  onPress,
  pressHint,
  status = "ready",
  onRetry,
  size = "md",
  testID = "balance-card",
}: BalanceCardProps) {
  const colors = useThemeColors();
  const hidden = useBalanceVisibility((s) => s.hidden);
  const toggleHidden = useBalanceVisibility((s) => s.toggle);
  const [infoOpen, setInfoOpen] = useState(false);
  const compact = size === "sm";

  const header = (
    <View className="flex-row items-center justify-between">
      <Text
        className="text-caption font-body font-bold text-foreground-secondary"
        importantForAccessibility="no"
        accessibilityElementsHidden
      >
        {label}
      </Text>
      <Pressable
        testID={`${testID}-toggle`}
        onPress={toggleHidden}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={hidden ? "Show balances" : "Hide balances"}
      >
        <Icon name={hidden ? "eye-off" : "eye"} size={18} color={colors.textSecondary} />
      </Pressable>
    </View>
  );

  const loadingBody = (
    <View
      testID={`${testID}-loading`}
      accessible
      accessibilityLabel="Loading balance"
      className="mt-2 gap-3"
    >
      <Skeleton width="60%" height={compact ? 28 : 36} borderRadius={8} />
      {held && <Skeleton height={6} borderRadius={3} />}
      {held && !compact && <Skeleton width="80%" height={14} />}
      {held && !compact && <Skeleton width="70%" height={14} />}
      {action && !compact && <Skeleton height={48} borderRadius={24} />}
    </View>
  );

  const errorBody = (
    <View testID={`${testID}-error`} className="mt-3 gap-3">
      <View className="flex-row items-start gap-2">
        <Icon name="alert-circle" size={18} color={colors.error} />
        <View className="flex-1">
          <Text className="text-body-md font-body font-bold text-foreground">
            Couldn't load your balance
          </Text>
          <Text className="text-body-sm font-body text-foreground-secondary mt-1">
            Your money is safe. Check your connection and try again.
          </Text>
        </View>
      </View>
      {onRetry && (
        <Button
          title="Retry"
          variant="outline"
          size="sm"
          onPress={onRetry}
          testID={`${testID}-retry`}
          leftIcon={<Icon name="refresh-cw" size={16} color={colors.primary} />}
        />
      )}
    </View>
  );

  const readyBody = (
    <>
      <View
        testID={`${testID}-summary`}
        accessible
        accessibilityLabel={summaryLabel(label, available, held, hidden)}
        className={compact ? "mt-1 mb-3" : "mt-1 mb-4"}
      >
        <View className="flex-row items-baseline gap-1">
          <Text className="text-body-lg font-heading font-bold text-primary">GHS</Text>
          <Text
            testID={`${testID}-amount`}
            className={`${compact ? "text-display-md" : "text-money-secondary"} font-heading font-black text-primary`}
            style={TABULAR}
          >
            {hidden ? "••••••" : formatMoney(available, "")}
          </Text>
        </View>
      </View>

      {held && (
        <SplitBar available={available} held={held.amount} hidden={hidden} testID={testID} />
      )}

      {held && compact && (
        <View className="flex-row items-center justify-between mt-3">
          <Text className="text-body-sm font-body text-foreground-secondary">{held.label}</Text>
          <Text className="text-body-sm font-body font-bold text-foreground" style={TABULAR}>
            {displayMoney(held.amount, hidden)}
          </Text>
        </View>
      )}

      {held && !compact && (
        <View className="mt-2">
          <LegendRow dotClass="bg-primary" label="Available" value={displayMoney(available, hidden)} />
          <View className="border-t border-border">
            <LegendRow
              dotClass="bg-money-held"
              label={held.label}
              value={displayMoney(held.amount, hidden)}
              info={{
                open: infoOpen,
                onToggle: () => setInfoOpen((o) => !o),
                text: held.info,
                testID,
                color: colors.primary,
              }}
            />
          </View>
        </View>
      )}

      {action && !compact && (
        <Button
          title={action.title}
          onPress={action.onPress}
          className="mt-4"
          testID={`${testID}-action`}
          leftIcon={<Icon name={action.icon} size={18} color={colors.primaryText} />}
        />
      )}

      {compact && onPress && pressHint && (
        <Pressable
          testID={`${testID}-hint`}
          onPress={onPress}
          hitSlop={HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel={pressHint}
          className="flex-row items-center justify-end gap-1 mt-3"
        >
          <Text className="text-body-sm font-body font-bold text-primary">{pressHint}</Text>
          <Icon name="chevron-right" size={16} color={colors.primary} />
        </Pressable>
      )}
    </>
  );

  const body = status === "loading" ? loadingBody : status === "error" ? errorBody : readyBody;
  const containerClass = `bg-card border border-border rounded-2xl ${compact ? "p-4" : "p-5"}`;

  if (onPress) {
    // accessible={false} keeps the eye toggle and the hint focusable for
    // screen readers; touch users can still tap anywhere on the card.
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        accessible={false}
        className={containerClass}
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      >
        {header}
        {body}
      </Pressable>
    );
  }

  return (
    <View testID={testID} className={containerClass}>
      {header}
      {body}
    </View>
  );
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `cd apps/mobile && npx jest src/components/ui/BalanceCard.test.tsx src/components/ui/Icon.test.tsx src/theme`
Expected: PASS (BalanceCard 13 tests, Icon 3 tests, theme tests unchanged and green).

- [ ] **Step 8: Typecheck**

Run: `cd apps/mobile && npx tsc --noEmit`
Expected: no errors in `BalanceCard.tsx`, `tokens.ts`, `Icon.tsx`. `ThemeColors` is derived from `lightTokens`, so `darkTokens` must include `moneyHeld`; Step 5 adds it.

- [ ] **Step 9: Commit**

```bash
git add apps/mobile/src/components/ui/BalanceCard.tsx apps/mobile/src/components/ui/BalanceCard.test.tsx apps/mobile/global.css apps/mobile/tailwind.config.js apps/mobile/src/theme/tokens.ts apps/mobile/src/components/ui/Icon.tsx apps/mobile/src/components/ui/Icon.test.tsx
git commit -m "feat(mobile): add BalanceCard with split bar, hide toggle, loading and error states"
```

---

### Task 3: `EarningsStatTiles` component

**Files:**
- Create: `apps/mobile/src/components/ui/EarningsStatTiles.tsx`
- Test: `apps/mobile/src/components/ui/EarningsStatTiles.test.tsx`

**Interfaces:**
- Consumes: `useBalanceVisibility`, `displayMoney` (Task 1); `Skeleton`; `foreground-secondary` colour (Task 2).
- Produces:

```ts
export interface EarningsStatTilesProps {
  today: number;
  thisWeek: number;
  onPress: () => void;
  loading?: boolean;
}
export function EarningsStatTiles(props: EarningsStatTilesProps): JSX.Element;
```

  testIDs: `stat-tile-today`, `stat-tile-week`.

- [ ] **Step 1: Write the failing test**

`apps/mobile/src/components/ui/EarningsStatTiles.test.tsx`:

```tsx
import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { EarningsStatTiles } from "./EarningsStatTiles";
import { useBalanceVisibility } from "@/lib/stores/balance-visibility-store";

describe("EarningsStatTiles", () => {
  beforeEach(() => {
    act(() => useBalanceVisibility.setState({ hidden: false }));
  });

  it("renders formatted today and this-week amounts", () => {
    const { getByText } = render(
      <EarningsStatTiles today={640} thisWeek={4320} onPress={jest.fn()} />
    );
    expect(getByText("Today")).toBeTruthy();
    expect(getByText("GHS 640.00")).toBeTruthy();
    expect(getByText("This week")).toBeTruthy();
    expect(getByText("GHS 4,320.00")).toBeTruthy();
  });

  it("masks amounts when balances are hidden", () => {
    act(() => useBalanceVisibility.setState({ hidden: true }));
    const { getAllByText, queryByText } = render(
      <EarningsStatTiles today={640} thisWeek={4320} onPress={jest.fn()} />
    );
    expect(getAllByText("GHS ••••")).toHaveLength(2);
    expect(queryByText(/640/)).toBeNull();
  });

  it("shows no amounts while loading", () => {
    const { queryByText } = render(
      <EarningsStatTiles today={0} thisWeek={0} onPress={jest.fn()} loading />
    );
    expect(queryByText(/0\.00/)).toBeNull();
  });

  it("calls onPress from either tile", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <EarningsStatTiles today={1} thisWeek={2} onPress={onPress} />
    );
    fireEvent.press(getByTestId("stat-tile-today"));
    fireEvent.press(getByTestId("stat-tile-week"));
    expect(onPress).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/mobile && npx jest src/components/ui/EarningsStatTiles.test.tsx`
Expected: FAIL with "Cannot find module './EarningsStatTiles'".

- [ ] **Step 3: Implement**

`apps/mobile/src/components/ui/EarningsStatTiles.tsx`:

```tsx
import React from "react";
import { View, Text, Pressable } from "react-native";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatMoney } from "@/lib/money";
import { displayMoney } from "@/lib/balance";
import { useBalanceVisibility } from "@/lib/stores/balance-visibility-store";

export interface EarningsStatTilesProps {
  today: number;
  thisWeek: number;
  onPress: () => void;
  loading?: boolean;
}

export function EarningsStatTiles({ today, thisWeek, onPress, loading = false }: EarningsStatTilesProps) {
  const hidden = useBalanceVisibility((s) => s.hidden);
  const tiles = [
    { key: "today", label: "Today", value: today },
    { key: "week", label: "This week", value: thisWeek },
  ];

  return (
    <View className="flex-row gap-3">
      {tiles.map((t) => (
        <Pressable
          key={t.key}
          testID={`stat-tile-${t.key}`}
          onPress={onPress}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={
            loading
              ? `${t.label}, loading`
              : hidden
                ? `${t.label}, hidden`
                : `${t.label}, ${formatMoney(t.value)}`
          }
          className="flex-1 bg-card border border-border rounded-xl p-4"
        >
          <Text className="text-caption font-body font-bold text-foreground-secondary">{t.label}</Text>
          {loading ? (
            <Skeleton width="70%" height={20} borderRadius={6} style={{ marginTop: 6 }} />
          ) : (
            <Text
              className="text-body-lg font-heading font-bold text-foreground mt-1"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {displayMoney(t.value, hidden)}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/mobile && npx jest src/components/ui/EarningsStatTiles.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/ui/EarningsStatTiles.tsx apps/mobile/src/components/ui/EarningsStatTiles.test.tsx
git commit -m "feat(mobile): add EarningsStatTiles for today and this-week earnings"
```

---

### Task 4: Server — vendor pending clearance from HELD escrow

**Files:**
- Modify: `apps/server/src/modules/vendor/vendor.service.ts` (`getEarnings`, ~line 339–386)
- Modify: `apps/server/src/modules/vendor/vendor.service.spec.ts` (mock line 45; `describe("getEarnings")`)

**Interfaces:**
- Consumes: `prisma.escrow.aggregate({ where, _sum })` (Prisma).
- Produces: `GET /vendor/earnings` → `pendingClearance: number` = sum of `Escrow.netAmount` where `vendorId = profile.id AND status = "HELD"`. Response shape otherwise unchanged.

- [ ] **Step 1: Add `aggregate` to the spec's escrow mock**

In `apps/server/src/modules/vendor/vendor.service.spec.ts`, replace line 45:

```ts
  escrow: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
```

with:

```ts
  escrow: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
  },
```

- [ ] **Step 2: Write the failing tests**

In the same file, replace the whole `describe("getEarnings", ...)` block with:

```ts
  describe("getEarnings", () => {
    beforeEach(() => {
      prisma.vendorProfile.findUnique.mockResolvedValue({
        id: "vp1",
        userId: "u1",
        totalEarnings: 10000,
        pendingPayout: 2500, // legacy column, never written — must be ignored
      });
      prisma.wallet.findUnique.mockResolvedValue({ id: "w1", userId: "u1", balance: 1500 });
    });

    it("returns availableBalance, pendingClearance, todayRevenue, thisWeekRevenue, and recentTransactions", async () => {
      prisma.escrow.aggregate.mockResolvedValue({ _sum: { netAmount: 2150 } });
      const today = new Date();
      prisma.transaction.findMany.mockResolvedValue([
        { type: "EARNINGS", status: "COMPLETED", amount: 500, createdAt: today, reference: "t1" },
        { type: "EARNINGS", status: "COMPLETED", amount: 1000, createdAt: today, reference: "t2" },
        {
          type: "WITHDRAWAL",
          status: "COMPLETED",
          amount: 3000,
          createdAt: new Date("2023-01-01"),
          reference: "t3",
        },
      ]);

      const result = await service.getEarnings("u1");
      expect(result.availableBalance).toBe(1500);
      expect(result.pendingClearance).toBe(2150);
      expect(result.todayRevenue).toBe(1500);
      expect(result.thisWeekRevenue).toBe(1500);
      expect(result.recentTransactions).toHaveLength(3);
      expect(result.recentTransactions[0].id).toBe("t1");
    });

    it("sums only HELD escrow netAmount for this vendor", async () => {
      prisma.escrow.aggregate.mockResolvedValue({ _sum: { netAmount: 2150 } });
      prisma.transaction.findMany.mockResolvedValue([]);
      await service.getEarnings("u1");
      expect(prisma.escrow.aggregate).toHaveBeenCalledWith({
        where: { vendorId: "vp1", status: "HELD" },
        _sum: { netAmount: true },
      });
    });

    it("returns 0 pending clearance when nothing is held", async () => {
      prisma.escrow.aggregate.mockResolvedValue({ _sum: { netAmount: null } });
      prisma.transaction.findMany.mockResolvedValue([]);
      const result = await service.getEarnings("u1");
      expect(result.pendingClearance).toBe(0);
    });
  });
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd apps/server && npx jest src/modules/vendor/vendor.service.spec.ts -t getEarnings`
Expected: FAIL. The first test gets `pendingClearance` 2500 (the legacy column) instead of 2150; the "HELD" test fails because `aggregate` is never called.

- [ ] **Step 4: Implement**

In `apps/server/src/modules/vendor/vendor.service.ts` `getEarnings`, directly after the line `const wallet = await this.prisma.wallet.findUnique({ where: { userId } });` add:

```ts
    // Pending = money still in escrow for this vendor's orders. It moves into
    // the wallet (as netAmount) when EscrowService.release runs. Disputed rows
    // are excluded on purpose; VendorProfile.pendingPayout is never written.
    const heldEscrow = await this.prisma.escrow.aggregate({
      where: { vendorId: profile.id, status: "HELD" },
      _sum: { netAmount: true },
    });
```

And in the returned object replace:

```ts
      pendingClearance: Number(profile.pendingPayout),
```

with:

```ts
      pendingClearance: Number(heldEscrow._sum.netAmount ?? 0),
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd apps/server && npx jest src/modules/vendor/vendor.service.spec.ts`
Expected: PASS (whole file green).

- [ ] **Step 6: Commit**

```bash
git add apps/server/src/modules/vendor/vendor.service.ts apps/server/src/modules/vendor/vendor.service.spec.ts
git commit -m "fix(server): derive vendor pending clearance from held escrow"
```

---

### Task 5: Server — admin user and dispatcher balance fields

> If background task `task_5f1292e8` (GET /wallet leak fix) has already merged and changed `getUser`'s `include` to a `select`, keep its `select` exactly and add the new fields on top of whatever it returns.

**Files:**
- Modify: `apps/server/src/modules/admin/admin.service.ts` (`getUser` ~line 51, `getDispatcher` ~line 632)
- Modify: `apps/server/src/modules/admin/admin.service.spec.ts` (escrow mock line 41; `describe("getUser")`; new `describe("getDispatcher")`)

**Interfaces:**
- Produces:
  - `GET /admin/users/:id` → adds `wallet.heldInEscrow: number` (when a wallet exists; `wallet` is `null` otherwise) and `vendorPendingClearance: number | null` (null when the user has no vendor profile).
  - `GET /admin/dispatchers/:id` → adds `walletBalance: number` (0 when there's no wallet).

- [ ] **Step 1: Add `aggregate` to the admin spec escrow mock**

In `apps/server/src/modules/admin/admin.service.spec.ts`, replace line 41:

```ts
  escrow: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
```

with:

```ts
  escrow: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
  },
```

- [ ] **Step 2: Write the failing tests**

Replace the whole `describe("getUser", ...)` block with:

```ts
  describe("getUser", () => {
    it("throws NotFoundException if user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getUser("u1")).rejects.toThrow(NotFoundException);
    });

    it("returns user with relations and null balances when there is no wallet or vendor profile", async () => {
      const user = {
        id: "u1",
        name: "Alice",
        orders: [],
        payments: [],
        wallet: null,
        vendorProfile: null,
      };
      prisma.user.findUnique.mockResolvedValue(user);
      const result = await service.getUser("u1");
      expect(result).toEqual({ ...user, vendorPendingClearance: null });
      expect(prisma.escrow.aggregate).not.toHaveBeenCalled();
    });

    it("adds buyer escrow held and vendor pending clearance", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        orders: [],
        payments: [],
        wallet: { id: "w1", balance: 100 },
        vendorProfile: { id: "vp1" },
      });
      prisma.escrow.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 180 } })
        .mockResolvedValueOnce({ _sum: { netAmount: 2150 } });

      const result: any = await service.getUser("u1");
      expect(result.wallet.heldInEscrow).toBe(180);
      expect(result.vendorPendingClearance).toBe(2150);
      expect(prisma.escrow.aggregate).toHaveBeenCalledWith({
        where: { buyerWalletId: "w1", status: "HELD" },
        _sum: { amount: true },
      });
      expect(prisma.escrow.aggregate).toHaveBeenCalledWith({
        where: { vendorId: "vp1", status: "HELD" },
        _sum: { netAmount: true },
      });
    });
  });

  describe("getDispatcher", () => {
    beforeEach(() => {
      prisma.dispatcherProfile = { findUnique: jest.fn() };
      prisma.deliveryJob = { count: jest.fn().mockResolvedValue(0) };
    });

    it("adds the dispatcher's wallet balance", async () => {
      prisma.dispatcherProfile.findUnique.mockResolvedValue({ id: "d1", userId: "u9", jobs: [] });
      prisma.wallet.findUnique.mockResolvedValue({ balance: 312.4 });
      const result: any = await service.getDispatcher("d1");
      expect(result.walletBalance).toBe(312.4);
      expect(prisma.wallet.findUnique).toHaveBeenCalledWith({
        where: { userId: "u9" },
        select: { balance: true },
      });
    });

    it("returns 0 wallet balance when the dispatcher has no wallet", async () => {
      prisma.dispatcherProfile.findUnique.mockResolvedValue({ id: "d1", userId: "u9", jobs: [] });
      prisma.wallet.findUnique.mockResolvedValue(null);
      const result: any = await service.getDispatcher("d1");
      expect(result.walletBalance).toBe(0);
    });
  });
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd apps/server && npx jest src/modules/admin/admin.service.spec.ts -t "getUser|getDispatcher"`
Expected: FAIL. `vendorPendingClearance`, `heldInEscrow` and `walletBalance` are undefined.

- [ ] **Step 4: Implement `getUser`**

Replace `getUser` in `apps/server/src/modules/admin/admin.service.ts` with:

```ts
  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        orders: true,
        payments: true,
        wallet: true,
        vendorProfile: true,
      },
    });
    if (!user) throw new NotFoundException("User not found");

    // Read-only escrow totals for the admin balance card. HELD only.
    const [buyerHeld, vendorHeld] = await Promise.all([
      user.wallet
        ? this.prisma.escrow.aggregate({
            where: { buyerWalletId: user.wallet.id, status: "HELD" },
            _sum: { amount: true },
          })
        : null,
      user.vendorProfile
        ? this.prisma.escrow.aggregate({
            where: { vendorId: user.vendorProfile.id, status: "HELD" },
            _sum: { netAmount: true },
          })
        : null,
    ]);

    return {
      ...user,
      wallet: user.wallet
        ? { ...user.wallet, heldInEscrow: Number(buyerHeld?._sum.amount ?? 0) }
        : null,
      vendorPendingClearance: user.vendorProfile
        ? Number(vendorHeld?._sum.netAmount ?? 0)
        : null,
    };
  }
```

- [ ] **Step 5: Implement `getDispatcher`**

In `getDispatcher`, replace the final line `return { ...dispatcher, stats };` with:

```ts
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: dispatcher.userId },
      select: { balance: true },
    });

    return { ...dispatcher, stats, walletBalance: wallet ? Number(wallet.balance) : 0 };
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd apps/server && npx jest src/modules/admin`
Expected: PASS (service and controller specs green).

- [ ] **Step 7: Commit**

```bash
git add apps/server/src/modules/admin/admin.service.ts apps/server/src/modules/admin/admin.service.spec.ts
git commit -m "feat(server): expose held escrow and wallet balance on admin user and dispatcher detail"
```

---

### Task 6: Vendor earnings screen adopts BalanceCard

**Files:**
- Modify (full rewrite): `apps/mobile/app/(vendor)/(earnings)/index.tsx`
- Test: `apps/mobile/__tests__/routes/(vendor)/(earnings)/index.test.tsx` (new)

**Interfaces:**
- Consumes: `BalanceCard` (Task 2), `EarningsStatTiles` (Task 3), `HELD_INFO` (Task 1), `useVendorEarnings()` → `{ data?: { availableBalance, pendingClearance, todayRevenue, thisWeekRevenue, recentTransactions }, isLoading, isError, refetch }`.

- [ ] **Step 1: Write the failing screen test**

`apps/mobile/__tests__/routes/(vendor)/(earnings)/index.test.tsx`:

```tsx
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react-native";
import EarningsDashboardScreen from "../../../../app/(vendor)/(earnings)/index";
import { useVendorEarnings } from "@/lib/hooks/use-vendor";
import { useBalanceVisibility } from "@/lib/stores/balance-visibility-store";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 10 }),
}));

jest.mock("@/lib/hooks/use-vendor", () => ({
  useVendorEarnings: jest.fn(),
}));

const ready = {
  availableBalance: 12480.5,
  pendingClearance: 2150,
  todayRevenue: 640,
  thisWeekRevenue: 4320,
  recentTransactions: [],
};

describe("Vendor EarningsDashboardScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => useBalanceVisibility.setState({ hidden: false }));
  });

  it("shows available, pending clearance and the stat tiles", () => {
    (useVendorEarnings as jest.Mock).mockReturnValue({
      data: ready,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<EarningsDashboardScreen />);
    expect(
      screen.getByLabelText("Available to withdraw, GHS 12,480.50. Pending clearance, GHS 2,150.00.")
    ).toBeTruthy();
    expect(screen.getByText("GHS 640.00")).toBeTruthy();
    expect(screen.getByText("GHS 4,320.00")).toBeTruthy();
    expect(screen.queryByText(/GH₵/)).toBeNull();
  });

  it("opens withdraw from the card action", () => {
    (useVendorEarnings as jest.Mock).mockReturnValue({
      data: ready,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<EarningsDashboardScreen />);
    fireEvent.press(screen.getByText("Withdraw"));
    expect(mockPush).toHaveBeenCalledWith("/(vendor)/(earnings)/withdraw");
  });

  it("never shows 0.00 while loading", () => {
    (useVendorEarnings as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    render(<EarningsDashboardScreen />);
    expect(screen.queryByText(/0\.00/)).toBeNull();
  });

  it("offers Retry on error and refetches", () => {
    const refetch = jest.fn();
    (useVendorEarnings as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    });
    render(<EarningsDashboardScreen />);
    expect(screen.getByText("Couldn't load your balance")).toBeTruthy();
    fireEvent.press(screen.getByText("Retry"));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/mobile && npx jest "__tests__/routes/(vendor)/(earnings)/index.test.tsx"`
Expected: FAIL. The summary label isn't found; the current screen shows "GHS" and "GH₵" and a bare error text with no Retry.

- [ ] **Step 3: Rewrite the screen**

Replace the entire contents of `apps/mobile/app/(vendor)/(earnings)/index.tsx` with:

```tsx
import { tokens } from "@/theme/tokens";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { BalanceCard } from "@/components/ui/BalanceCard";
import { EarningsStatTiles } from "@/components/ui/EarningsStatTiles";
import { useVendorEarnings } from "@/lib/hooks/use-vendor";
import { HELD_INFO } from "@/lib/balance";

export default function EarningsDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: earnings, isLoading, isError, refetch } = useVendorEarnings();
  const status = isLoading ? "loading" : isError ? "error" : "ready";

  const handleTransactionPress = (trx: any) => {
    if (trx.type === "order") {
      router.push(`/(vendor)/(orders)/${trx.orderId}`);
    } else {
      Alert.alert(
        "Withdrawal Receipt",
        `Transaction ID: ${trx.id}\nAmount: GHS ${Math.abs(trx.amount).toFixed(2)}\nStatus: ${trx.status.toUpperCase()}\nDate: ${trx.date}`,
        [{ text: "Close", style: "cancel" }]
      );
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-end justify-between"
        style={{ paddingTop: Math.max(insets.top, 12) + 12 }}
      >
        <View>
          <Text className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-[2px]">
            Vendor
          </Text>
          <Text className="text-display-md font-heading font-black text-foreground">Earnings</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Help"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="w-[36px] h-[36px] rounded-full bg-background border border-border items-center justify-center"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.push("/(vendor)/(settings)/help")}
        >
          <Icon name="help-circle" size={17} color={tokens.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="pb-24 pt-6 gap-6"
        showsVerticalScrollIndicator={false}
      >
        <BalanceCard
          testID="vendor-balance"
          label="Available to withdraw"
          available={Number(earnings?.availableBalance ?? 0)}
          held={{
            label: "Pending clearance",
            amount: Number(earnings?.pendingClearance ?? 0),
            info: HELD_INFO.vendor,
          }}
          action={{
            title: "Withdraw",
            icon: "arrow-up-right",
            onPress: () => router.push("/(vendor)/(earnings)/withdraw"),
          }}
          status={status}
          onRetry={() => refetch()}
        />

        {status !== "error" && (
          <EarningsStatTiles
            today={Number(earnings?.todayRevenue ?? 0)}
            thisWeek={Number(earnings?.thisWeekRevenue ?? 0)}
            loading={status === "loading"}
            onPress={() => router.push("/(vendor)/(earnings)/analytics")}
          />
        )}

        {status === "ready" && (
          <View>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-heading-md font-bold text-foreground">Recent Transactions</Text>
              <Pressable onPress={() => router.push("/(vendor)/(earnings)/transactions")}>
                <Text className="text-body-md font-bold text-primary">See All</Text>
              </Pressable>
            </View>

            <View className="bg-card rounded-2xl border border-border overflow-hidden">
              {(earnings?.recentTransactions ?? []).map((trx: any, index: number, arr: any[]) => {
                const isWithdrawal = trx.type === "withdrawal";

                return (
                  <Pressable
                    key={trx.id}
                    className={`h-[56px] px-4 flex-row items-center justify-between ${
                      index < arr.length - 1 ? "border-b border-border" : ""
                    }`}
                    style={({ pressed }) => [{ backgroundColor: pressed ? "#f8fafc" : "white" }]}
                    onPress={() => handleTransactionPress(trx)}
                  >
                    <View className="flex-row items-center flex-1">
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                          isWithdrawal ? "bg-rose-50" : "bg-green-50"
                        }`}
                      >
                        <Icon
                          name={isWithdrawal ? "arrow-up-right" : "arrow-down-left"}
                          size={16}
                          color={isWithdrawal ? tokens.error : tokens.success}
                        />
                      </View>
                      <View className="flex-1 pr-2 justify-center">
                        <Text
                          className="text-[14px] font-bold text-foreground mb-0.5"
                          numberOfLines={1}
                        >
                          {trx.title}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end justify-center">
                      <Text
                        className={`text-[14px] font-bold ${
                          isWithdrawal ? "text-foreground" : "text-green-600"
                        }`}
                      >
                        {isWithdrawal ? "" : "+"}GHS {Math.abs(trx.amount).toFixed(2)}
                      </Text>
                      <Text className="text-[10px] text-muted-foreground uppercase font-bold mt-0.5">
                        {trx.status} • {trx.date}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
```

(The header and the Recent Transactions list are copied unchanged from the current file. Their pre-existing arbitrary classes are out of scope.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/mobile && npx jest "__tests__/routes/(vendor)/(earnings)"`
Expected: PASS (new index test with 4 tests, plus the existing withdraw test).

- [ ] **Step 5: Commit**

```bash
git add "apps/mobile/app/(vendor)/(earnings)/index.tsx" "apps/mobile/__tests__/routes/(vendor)/(earnings)/index.test.tsx"
git commit -m "feat(mobile): vendor earnings uses BalanceCard and stat tiles"
```

---

### Task 7: Rider earnings screen adopts BalanceCard

**Files:**
- Modify (full rewrite): `apps/mobile/app/(dispatcher)/(tabs)/(earnings)/index.tsx`
- Test: `apps/mobile/__tests__/routes/(dispatcher)/(tabs)/(earnings)/index.test.tsx` (new)

**Interfaces:**
- Consumes: `BalanceCard`, `EarningsStatTiles`, `HELD_INFO`; `useDispatcherEarnings()` → `{ data?: { availableBalance, pendingClearance, todayRevenue, thisWeekRevenue, recentTransactions }, isLoading, isError, refetch }`.

- [ ] **Step 1: Write the failing screen test**

`apps/mobile/__tests__/routes/(dispatcher)/(tabs)/(earnings)/index.test.tsx`:

```tsx
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react-native";
import EarningsDashboardScreen from "../../../../../app/(dispatcher)/(tabs)/(earnings)/index";
import { useDispatcherEarnings } from "@/lib/hooks/use-dispatcher";
import { useBalanceVisibility } from "@/lib/stores/balance-visibility-store";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 10 }),
}));

jest.mock("@/lib/hooks/use-dispatcher", () => ({
  useDispatcherEarnings: jest.fn(),
}));

const ready = {
  availableBalance: 312.4,
  pendingClearance: 134,
  todayRevenue: 84,
  thisWeekRevenue: 520,
  recentTransactions: [
    {
      id: "t1",
      type: "payout",
      title: "Delivery payout",
      amount: 12,
      status: "completed",
      date: "Sep 25",
    },
  ],
};

describe("Rider EarningsDashboardScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => useBalanceVisibility.setState({ hidden: false }));
  });

  it("shows available, pending clearance and the stat tiles", () => {
    (useDispatcherEarnings as jest.Mock).mockReturnValue({
      data: ready,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<EarningsDashboardScreen />);
    expect(
      screen.getByLabelText("Available to withdraw, GHS 312.40. Pending clearance, GHS 134.00.")
    ).toBeTruthy();
    expect(screen.getByText("GHS 84.00")).toBeTruthy();
    expect(screen.getByText("GHS 520.00")).toBeTruthy();
    expect(screen.getByText("+GHS 12.00")).toBeTruthy();
    expect(screen.queryByText(/GH₵/)).toBeNull();
  });

  it("has a labelled Withdraw action that opens withdraw", () => {
    (useDispatcherEarnings as jest.Mock).mockReturnValue({
      data: ready,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<EarningsDashboardScreen />);
    fireEvent.press(screen.getByText("Withdraw"));
    expect(mockPush).toHaveBeenCalledWith("/(dispatcher)/(tabs)/(earnings)/withdraw");
  });

  it("never shows 0.00 while loading", () => {
    (useDispatcherEarnings as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    render(<EarningsDashboardScreen />);
    expect(screen.queryByText(/0\.00/)).toBeNull();
  });

  it("offers Retry on error and refetches", () => {
    const refetch = jest.fn();
    (useDispatcherEarnings as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    });
    render(<EarningsDashboardScreen />);
    fireEvent.press(screen.getByText("Retry"));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/mobile && npx jest "__tests__/routes/(dispatcher)/(tabs)/(earnings)/index.test.tsx"`
Expected: FAIL. The summary label isn't found, and the current Withdraw button is an unlabelled icon, so `getByText("Withdraw")` fails.

- [ ] **Step 3: Rewrite the screen**

Replace the entire contents of `apps/mobile/app/(dispatcher)/(tabs)/(earnings)/index.tsx` with:

```tsx
import { tokens } from "@/theme/tokens";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { BalanceCard } from "@/components/ui/BalanceCard";
import { EarningsStatTiles } from "@/components/ui/EarningsStatTiles";
import { useDispatcherEarnings } from "@/lib/hooks/use-dispatcher";
import { HELD_INFO } from "@/lib/balance";

export default function EarningsDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: earnings, isLoading, isError, refetch } = useDispatcherEarnings();
  const status = isLoading ? "loading" : isError ? "error" : "ready";

  const handleTransactionPress = (trx: any) => {
    if (trx.type === "withdrawal") {
      Alert.alert(
        "Withdrawal Receipt",
        `Transaction ID: ${trx.id}\nAmount: GHS ${Math.abs(trx.amount).toFixed(2)}\nStatus: ${trx.status.toUpperCase()}\nDate: ${trx.date}`,
        [{ text: "Close", style: "cancel" }]
      );
    } else {
      Alert.alert(
        "Delivery Payout",
        `Transaction ID: ${trx.id}\nAmount: GHS ${trx.amount.toFixed(2)}\nStatus: ${trx.status.toUpperCase()}\nDate: ${trx.date}`,
        [{ text: "Close", style: "cancel" }]
      );
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-5 py-4 bg-card border-b border-border flex-row items-end justify-between">
        <View>
          <Text className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-[2px]">
            Rider
          </Text>
          <Text className="text-display-md font-heading font-black text-foreground">Earnings</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Help"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="w-[36px] h-[36px] rounded-full bg-background border border-border items-center justify-center"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.push("/(dispatcher)/help")}
        >
          <Icon name="help-circle" size={17} color={tokens.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="pb-24 pt-6 gap-6"
        showsVerticalScrollIndicator={false}
      >
        <BalanceCard
          testID="rider-balance"
          label="Available to withdraw"
          available={Number(earnings?.availableBalance ?? 0)}
          held={{
            label: "Pending clearance",
            amount: Number(earnings?.pendingClearance ?? 0),
            info: HELD_INFO.rider,
          }}
          action={{
            title: "Withdraw",
            icon: "arrow-up-right",
            onPress: () => router.push("/(dispatcher)/(tabs)/(earnings)/withdraw"),
          }}
          status={status}
          onRetry={() => refetch()}
        />

        {status !== "error" && (
          <EarningsStatTiles
            today={Number(earnings?.todayRevenue ?? 0)}
            thisWeek={Number(earnings?.thisWeekRevenue ?? 0)}
            loading={status === "loading"}
            onPress={() => router.push("/(dispatcher)/(tabs)/(earnings)/analytics")}
          />
        )}

        {status === "ready" && (
          <View>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-heading-md font-bold text-foreground">Recent Transactions</Text>
              <Pressable onPress={() => router.push("/(dispatcher)/(tabs)/(earnings)/transactions")}>
                <Text className="text-body-md font-bold text-primary">See All</Text>
              </Pressable>
            </View>

            <View className="bg-card rounded-2xl border border-border overflow-hidden">
              {!earnings?.recentTransactions || earnings.recentTransactions.length === 0 ? (
                <View className="p-8 items-center justify-center">
                  <Icon name="file-text" size={32} color={tokens.textDisabled} />
                  <Text className="text-muted-foreground font-body mt-2">No recent transactions</Text>
                </View>
              ) : (
                earnings.recentTransactions.map((trx: any, index: number, arr: any[]) => {
                  const isWithdrawal = trx.type === "withdrawal";

                  return (
                    <Pressable
                      key={trx.id}
                      className={`h-[56px] px-4 flex-row items-center justify-between ${
                        index < arr.length - 1 ? "border-b border-border" : ""
                      }`}
                      style={({ pressed }) => [{ backgroundColor: pressed ? "#f8fafc" : "white" }]}
                      onPress={() => handleTransactionPress(trx)}
                    >
                      <View className="flex-row items-center flex-1">
                        <View
                          className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                            isWithdrawal ? "bg-rose-50" : "bg-green-50"
                          }`}
                        >
                          <Icon
                            name={isWithdrawal ? "arrow-up-right" : "arrow-down-left"}
                            size={16}
                            color={isWithdrawal ? tokens.error : tokens.success}
                          />
                        </View>
                        <View className="flex-1 pr-2 justify-center">
                          <Text
                            className="text-[14px] font-bold text-foreground mb-0.5"
                            numberOfLines={1}
                          >
                            {trx.title}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end justify-center">
                        <Text
                          className={`text-[14px] font-bold ${
                            isWithdrawal ? "text-foreground" : "text-green-600"
                          }`}
                        >
                          {isWithdrawal ? "" : "+"}GHS {Math.abs(trx.amount).toFixed(2)}
                        </Text>
                        <Text className="text-[10px] text-muted-foreground uppercase font-bold mt-0.5">
                          {trx.status} • {trx.date}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
```

(Header, receipt alerts and the transaction list are copied from the current file, except that the three `GH₵` strings in the receipt alerts and list rows become `GHS` (user decision 2026-09-25). The list is otherwise out of scope.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/mobile && npx jest "__tests__/routes/(dispatcher)/(tabs)/(earnings)/index.test.tsx"`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add "apps/mobile/app/(dispatcher)/(tabs)/(earnings)/index.tsx" "apps/mobile/__tests__/routes/(dispatcher)/(tabs)/(earnings)/index.test.tsx"
git commit -m "feat(mobile): rider earnings uses BalanceCard with a labelled Withdraw action"
```

---

### Task 8: Rider honesty fixes — withdraw "Available" and home pill

**Files:**
- Modify: `apps/mobile/app/(dispatcher)/(tabs)/(earnings)/withdraw.tsx` (line 44, line ~221)
- Modify: `apps/mobile/__tests__/routes/(dispatcher)/(tabs)/(earnings)/withdraw.test.tsx`
- Modify: `apps/mobile/app/(dispatcher)/(tabs)/(home)/index.tsx` (imports lines 13–18; hooks after line 36; pill ~line 511–515)

**Interfaces:**
- Consumes: `useDispatcherEarnings`, `useBalanceVisibility`, `displayMoney`, `formatMoney`.

- [ ] **Step 1: Update the withdraw test to expose the bug**

In `apps/mobile/__tests__/routes/(dispatcher)/(tabs)/(earnings)/withdraw.test.tsx`:
- In the first two tests, change `mockReturnValue({ data: { pendingClearance: 100 } })` to `mockReturnValue({ data: { availableBalance: 100, pendingClearance: 999 } })`.
- In "renders withdraw form when methods and PIN are set", change `mockReturnValue({ data: { pendingClearance: 250 } })` to `mockReturnValue({ data: { availableBalance: 250, pendingClearance: 999 } })`. Keep its assertion `expect(screen.getByText("Available: GHS 250.00")).toBeTruthy();`.
- Add this test inside the `describe`, reusing the same bank/momo/pin/withdraw mocks as the "renders withdraw form" test:

```tsx
  it("shows the withdrawable wallet balance, not pending clearance, with grouping", () => {
    (useDispatcherEarnings as jest.Mock).mockReturnValue({
      data: { availableBalance: 12480.5, pendingClearance: 999 },
    });
    (useBankAccounts as jest.Mock).mockReturnValue({
      data: [{ id: "b1", bankName: "Ecobank", accountNumber: "1234" }],
    });
    (useMomoAccounts as jest.Mock).mockReturnValue({ data: [] });
    (usePinStatus as jest.Mock).mockReturnValue({ data: { hasPin: true } });
    (useWithdraw as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });

    render(<WithdrawFundsScreen />);
    expect(screen.getByText("Available: GHS 12,480.50")).toBeTruthy();
    expect(screen.queryByText("Available: GHS 999.00")).toBeNull();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/mobile && npx jest "__tests__/routes/(dispatcher)/(tabs)/(earnings)/withdraw.test.tsx"`
Expected: FAIL. The screen shows "Available: GHS 999.00" because it reads `pendingClearance` and has no grouping.

- [ ] **Step 3: Fix the withdraw screen**

In `apps/mobile/app/(dispatcher)/(tabs)/(earnings)/withdraw.tsx`, replace line 44:

```ts
  const availableBalance = Number(earnings?.pendingClearance ?? 0);
```

with:

```ts
  // Withdrawals are enforced server-side against wallet.balance; show that.
  const availableBalance = Number(earnings?.availableBalance ?? 0);
```

and replace:

```tsx
                    Available: GHS {availableBalance.toFixed(2)}
```

with:

```tsx
                    {`Available: ${formatMoney(availableBalance)}`}
```

(`formatMoney` is already imported in this file.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/mobile && npx jest "__tests__/routes/(dispatcher)/(tabs)/(earnings)/withdraw.test.tsx"`
Expected: PASS (4 tests).

- [ ] **Step 5: Replace the fake home pill figure**

In `apps/mobile/app/(dispatcher)/(tabs)/(home)/index.tsx`:

Replace the import block:

```ts
import {
  useAvailableTasks,
  useMyTasks,
  useAcceptTask,
  useUpdateTaskStatus,
} from "@/lib/hooks/use-dispatcher";
```

with:

```ts
import {
  useAvailableTasks,
  useMyTasks,
  useAcceptTask,
  useUpdateTaskStatus,
  useDispatcherEarnings,
} from "@/lib/hooks/use-dispatcher";
import { useBalanceVisibility } from "@/lib/stores/balance-visibility-store";
import { displayMoney } from "@/lib/balance";
```

Directly after `  const mapRef = useRef<MapView>(null);` (line 36) add:

```ts
  const { data: earnings, isSuccess: earningsLoaded } = useDispatcherEarnings();
  const balancesHidden = useBalanceVisibility((s) => s.hidden);
```

Replace:

```tsx
            {isOnline && (
              <Text className="text-muted-foreground text-[11px] font-bold mt-0.5 ml-4">
                GH₵ 84.00 today · 6 trips
              </Text>
            )}
```

with:

```tsx
            {isOnline && earningsLoaded && (
              <Text className="text-muted-foreground text-caption font-bold mt-0.5 ml-4">
                {`${displayMoney(Number(earnings?.todayRevenue ?? 0), balancesHidden)} today`}
              </Text>
            )}
```

(The trip count is dropped because there is no data source for it. While loading or on error, only the Online/Offline line shows. The formatting is covered by `displayMoney`'s tests in Task 1. This map screen has no test harness, so check it in Step 6.)

- [ ] **Step 6: Typecheck and confirm the fake figure is gone**

Run: `cd apps/mobile && npx tsc --noEmit && grep -n "84.00" "app/(dispatcher)/(tabs)/(home)/index.tsx"`
Expected: tsc reports no errors; grep prints nothing (exit code 1).

- [ ] **Step 7: Commit**

```bash
git add "apps/mobile/app/(dispatcher)/(tabs)/(earnings)/withdraw.tsx" "apps/mobile/__tests__/routes/(dispatcher)/(tabs)/(earnings)/withdraw.test.tsx" "apps/mobile/app/(dispatcher)/(tabs)/(home)/index.tsx"
git commit -m "fix(mobile): rider withdraw shows wallet balance; home pill shows real today earnings"
```

---

### Task 9: Vendor dashboard compact card + vendor withdraw formatting

**Files:**
- Modify: `apps/mobile/app/(vendor)/(dashboard)/index.tsx` (import line 11; hook line 80; hero block lines 142–185)
- Modify: `apps/mobile/app/(vendor)/(earnings)/withdraw.tsx` (line ~214)
- Modify: `apps/mobile/__tests__/routes/(vendor)/(earnings)/withdraw.test.tsx`

**Interfaces:**
- Consumes: `BalanceCard` (size `sm`), `HELD_INFO`, `formatMoney`.

- [ ] **Step 1: Write the failing vendor withdraw test**

Add inside the `describe` in `apps/mobile/__tests__/routes/(vendor)/(earnings)/withdraw.test.tsx`:

```tsx
  it("groups thousands in the available amount", () => {
    (useVendorEarnings as jest.Mock).mockReturnValue({ data: { availableBalance: 12480.5 } });
    (useBankAccounts as jest.Mock).mockReturnValue({
      data: [{ id: "b1", bankName: "Ecobank", accountNumber: "1234" }],
    });
    (useMomoAccounts as jest.Mock).mockReturnValue({ data: [] });
    (usePinStatus as jest.Mock).mockReturnValue({ data: { hasPin: true } });
    (useWithdraw as jest.Mock).mockReturnValue({ mutate: jest.fn(), isPending: false });

    render(<WithdrawFundsScreen />);
    expect(screen.getByText("Available: GHS 12,480.50")).toBeTruthy();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/mobile && npx jest "__tests__/routes/(vendor)/(earnings)/withdraw.test.tsx"`
Expected: FAIL. The screen renders "Available: GHS 12480.50" with no grouping.

- [ ] **Step 3: Fix the vendor withdraw line**

In `apps/mobile/app/(vendor)/(earnings)/withdraw.tsx`, replace:

```tsx
                    Available: GHS {availableBalance.toFixed(2)}
```

with:

```tsx
                    {`Available: ${formatMoney(availableBalance)}`}
```

(`formatMoney` is already imported.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/mobile && npx jest "__tests__/routes/(vendor)/(earnings)/withdraw.test.tsx"`
Expected: PASS (4 tests).

- [ ] **Step 5: Replace the dashboard hero with the compact card**

In `apps/mobile/app/(vendor)/(dashboard)/index.tsx`:

Delete line 11: `import { LinearGradient } from "expo-linear-gradient";` (its only use is the hero being replaced). Add these imports after the `useVendorEarnings` import line:

```ts
import { BalanceCard } from "@/components/ui/BalanceCard";
import { HELD_INFO } from "@/lib/balance";
```

Replace line 80:

```ts
  const { data: earningsData, refetch: refetchEarnings } = useVendorEarnings();
```

with:

```ts
  const {
    data: earningsData,
    isLoading: earningsLoading,
    isError: earningsError,
    refetch: refetchEarnings,
  } = useVendorEarnings();
```

Replace the whole `{/* ===== HERO / EARNINGS ===== */}` block (from that comment through the closing `</View>` right before `{/* ===== QUICK ACTIONS ===== */}`) with:

```tsx
        {/* ===== BALANCE ===== */}
        <View className="px-5 mb-8">
          <BalanceCard
            testID="vendor-dashboard-balance"
            size="sm"
            label="Available to withdraw"
            available={Number(earningsData?.availableBalance ?? 0)}
            held={{
              label: "Pending clearance",
              amount: Number(earningsData?.pendingClearance ?? 0),
              info: HELD_INFO.vendor,
            }}
            onPress={() => router.push("/(vendor)/(earnings)")}
            pressHint="View earnings"
            status={earningsLoading ? "loading" : earningsError ? "error" : "ready"}
            onRetry={() => refetchEarnings()}
          />
        </View>
```

- [ ] **Step 6: Typecheck and run the vendor suites**

Run: `cd apps/mobile && npx tsc --noEmit && npx jest "__tests__/routes/(vendor)" src/components/ui/BalanceCard.test.tsx`
Expected: no type errors; all PASS. The compact card's behaviour is covered by the BalanceCard "compact size" test; the dashboard has no screen test harness.

- [ ] **Step 7: Commit**

```bash
git add "apps/mobile/app/(vendor)/(dashboard)/index.tsx" "apps/mobile/app/(vendor)/(earnings)/withdraw.tsx" "apps/mobile/__tests__/routes/(vendor)/(earnings)/withdraw.test.tsx"
git commit -m "feat(mobile): vendor dashboard uses compact BalanceCard; withdraw groups thousands"
```

---

### Task 10: Customer wallet adopts BalanceCard; remove fabricated "Gold tier"

**Files:**
- Modify (full rewrite): `apps/mobile/app/(customer)/wallet/index.tsx`
- Modify: `apps/mobile/app/(customer)/wallet/rewards.tsx` (lines 134–136)
- Test: `apps/mobile/__tests__/routes/(customer)/wallet/index.test.tsx` (new)
- Modify: `apps/mobile/__tests__/routes/(customer)/wallet/rewards.test.tsx`

**Interfaces:**
- Consumes: `BalanceCard`, `HELD_INFO`, `useThemeColors`; `useWallet()` → `{ data?: { balance, currency, heldInEscrow? }, isLoading, isError, refetch }`; `useTransactions()`; `useWalletStore().bexieCoins`.
- Note: `heldInEscrow` arrives from the server in Task 13. Until then it's `undefined` and is treated as 0.

- [ ] **Step 1: Write the failing wallet screen test**

`apps/mobile/__tests__/routes/(customer)/wallet/index.test.tsx`:

```tsx
import React from "react";
import { render, screen, act } from "@testing-library/react-native";
import WalletScreen from "../../../../app/(customer)/wallet/index";
import { useWallet, useTransactions } from "@/lib/hooks/use-wallet";
import { useBalanceVisibility } from "@/lib/stores/balance-visibility-store";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 10, bottom: 10 }),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: any) => {
    const { View } = require("react-native");
    return <View>{children}</View>;
  },
}));

jest.mock("@/components/ui/BackButton", () => ({ BackButton: () => null }));

jest.mock("@/lib/hooks/use-wallet", () => ({
  useWallet: jest.fn(),
  useTransactions: jest.fn(),
}));

const txns = { data: { data: [] }, refetch: jest.fn() };

describe("WalletScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => useBalanceVisibility.setState({ hidden: false }));
    (useTransactions as jest.Mock).mockReturnValue(txns);
  });

  it("shows wallet balance and money on hold for orders", () => {
    (useWallet as jest.Mock).mockReturnValue({
      data: { balance: 1250, heldInEscrow: 180, currency: "GHS" },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<WalletScreen />);
    expect(
      screen.getByLabelText("Wallet balance, GHS 1,250.00. On hold for orders, GHS 180.00.")
    ).toBeTruthy();
    expect(screen.getByText("Top up")).toBeTruthy();
  });

  it("treats a missing heldInEscrow (older server) as zero", () => {
    (useWallet as jest.Mock).mockReturnValue({
      data: { balance: 1250, currency: "GHS" },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<WalletScreen />);
    expect(
      screen.getByLabelText("Wallet balance, GHS 1,250.00. On hold for orders, GHS 0.00.")
    ).toBeTruthy();
  });

  it("uses navy quick actions without a duplicate Top up", () => {
    (useWallet as jest.Mock).mockReturnValue({
      data: { balance: 1, currency: "GHS" },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<WalletScreen />);
    for (const label of ["Send", "Request", "Cards", "Link account"]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
    expect(screen.getAllByText("Top up")).toHaveLength(1);
  });

  it("never shows 0.00 while loading", () => {
    (useWallet as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    render(<WalletScreen />);
    expect(screen.queryByText(/0\.00/)).toBeNull();
  });

  it("does not claim a loyalty tier", () => {
    (useWallet as jest.Mock).mockReturnValue({
      data: { balance: 1, currency: "GHS" },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    render(<WalletScreen />);
    expect(screen.queryByText(/Gold tier/i)).toBeNull();
    expect(screen.getByText("BexieCoins")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Extend the rewards test**

In `apps/mobile/__tests__/routes/(customer)/wallet/rewards.test.tsx`, at the end of the test "enables redeem button when balance >= 100 and renders earn states", add:

```tsx
    expect(screen.queryByText(/Gold Tier/i)).toBeNull();
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd apps/mobile && npx jest "__tests__/routes/(customer)/wallet/index.test.tsx" "__tests__/routes/(customer)/wallet/rewards.test.tsx"`
Expected: FAIL. The wallet summary label isn't found and "Gold tier · BexieCoins" is present; rewards finds "Gold Tier Member".

- [ ] **Step 4: Remove the tier line from rewards**

In `apps/mobile/app/(customer)/wallet/rewards.tsx`, delete these three lines (134–136):

```tsx
              <Text className="text-body-lg text-white/80 font-medium font-body mb-1">
                Gold Tier Member
              </Text>
```

Nothing else in the rewards hero changes.

- [ ] **Step 5: Rewrite the wallet screen**

Replace the entire contents of `apps/mobile/app/(customer)/wallet/index.tsx` with:

```tsx
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "@/components/ui/BackButton";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { BalanceCard } from "@/components/ui/BalanceCard";
import { useWallet, useTransactions } from "@/lib/hooks/use-wallet";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { useThemeColors } from "@/theme/useThemeColors";
import { HELD_INFO } from "@/lib/balance";
import {
  getTransactionIcon,
  getTransactionColors,
  getAmountPrefix,
  formatDate,
} from "@/lib/utils/wallet";

// Top up lives on the balance card; the row holds the other money actions.
const QUICK_ACTIONS = [
  { id: "send", label: "Send", icon: "send", route: "/(customer)/wallet/transfer" },
  { id: "request", label: "Request", icon: "arrow-down-left", route: "/(customer)/wallet/request" },
  { id: "cards", label: "Cards", icon: "credit-card", route: "/(customer)/wallet/cards" },
  { id: "link", label: "Link account", icon: "link", route: "/(customer)/wallet/link-account" },
];

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: walletData,
    isLoading: walletLoading,
    isError: walletError,
    refetch: refetchWallet,
  } = useWallet();
  const { data: txnData, refetch: refetchTxns } = useTransactions();
  const { bexieCoins } = useWalletStore();

  const currency = walletData?.currency ?? "GHS";
  const transactions = txnData?.data ?? [];
  const walletStatus = walletLoading ? "loading" : walletError ? "error" : "ready";

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchWallet(), refetchTxns()]);
    setRefreshing(false);
  }, [refetchWallet, refetchTxns]);

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-display-sm font-heading font-black text-foreground">Wallet</Text>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-5 pt-4">
          <View className="mb-6 mt-2">
            <BalanceCard
              testID="wallet-balance"
              label="Wallet balance"
              available={Number(walletData?.balance ?? 0)}
              held={{
                label: "On hold for orders",
                amount: Number(walletData?.heldInEscrow ?? 0),
                info: HELD_INFO.customer,
              }}
              action={{
                title: "Top up",
                icon: "plus",
                onPress: () => router.push("/(customer)/wallet/topup"),
              }}
              status={walletStatus}
              onRetry={() => refetchWallet()}
            />
          </View>

          <View className="flex-row justify-between mb-6 px-1">
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => router.push(action.route as any)}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                className="items-center gap-2"
                style={{ width: "22%" }}
              >
                <View className="w-12 h-12 rounded-full items-center justify-center bg-primary-subtle">
                  <Icon name={action.icon} size={22} color={colors.primary} />
                </View>
                <Text className="text-caption font-body font-bold text-foreground text-center">
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push("/(customer)/wallet/rewards")}
            className="mb-8"
          >
            <View className="rounded-2xl overflow-hidden " style={{}}>
              <LinearGradient
                colors={["#f59e0b", "#d97706"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  position: "relative",
                }}
              >
                <View className="absolute right-[-16px] top-[-16px] opacity-[0.12]">
                  <Icon name="award" size={96} color="#fff" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/85">
                    BexieCoins
                  </Text>
                  <Text className="font-heading text-[28px] leading-[32px] font-black tracking-[-0.02em] text-white mt-[1px]">
                    {bexieCoins.toLocaleString()}
                  </Text>
                </View>
                <View className="bg-white rounded-full px-4 py-[9px]">
                  <Text className="text-[13px] font-bold text-[#B45309]">Redeem</Text>
                </View>
              </LinearGradient>
            </View>
          </Pressable>
        </View>

        <View className="px-5 pt-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Recent Activity
            </Text>
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push("/(customer)/wallet/transactions")}
            >
              <Text className="text-[12px] font-bold text-primary tracking-[0.1em] uppercase">
                View All
              </Text>
            </Pressable>
          </View>

          {transactions.length === 0 ? (
            <View className="bg-card p-6 rounded-2xl border border-border">
              <EmptyState
                iconName="file-text"
                title="No transactions yet"
                description="Your activity will appear here after your first transaction"
              />
            </View>
          ) : (
            <View className="bg-card rounded-2xl border border-border overflow-hidden">
              {transactions.slice(0, 5).map((tx: any, index: number) => {
                const txColors = getTransactionColors(tx.type);
                const prefix = getAmountPrefix(tx.type);
                const isPositive = prefix === "+";
                const isLast = index === Math.min(transactions.length, 5) - 1;

                return (
                  <Pressable
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    key={tx.id}
                    className={`flex-row items-center p-4 ${!isLast ? "border-b border-border" : ""}`}
                    onPress={() => router.push(`/(customer)/wallet/transaction/${tx.id}`)}
                  >
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: txColors.bg }}
                    >
                      <Icon name={getTransactionIcon(tx.type)} size={18} color={txColors.icon} />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-body-lg font-bold text-foreground font-body"
                        numberOfLines={1}
                      >
                        {tx.description}
                      </Text>
                      <Text className="text-body-sm text-muted-foreground font-body mt-0.5">
                        {formatDate(tx.createdAt ?? tx.date)}
                      </Text>
                    </View>
                    <Text
                      className={`text-body-lg font-bold font-heading ${isPositive ? "text-emerald-600" : "text-foreground"}`}
                    >
                      {prefix} {currency} {Number(tx.amount || tx.netAmount).toFixed(2)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
```

What changed versus the current file:
- Removed the stacked linked-card layers, `useCards`, `getCardColors`, the in-card refresh button, the "Link account" pill, `tokens`, and the local `showBalance` state.
- The rainbow quick actions are now navy-tinted, and Top up moved onto the card.
- In the coins strip, "Gold tier · BexieCoins" became "BexieCoins". The strip's design is otherwise untouched, per the spec.
- The transaction-row variable `colors` was renamed to `txColors`, because `colors` now holds the theme palette.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd apps/mobile && npx jest "__tests__/routes/(customer)/wallet"`
Expected: PASS (new wallet index test with 5 tests; rewards 3 tests).

- [ ] **Step 7: Commit**

```bash
git add "apps/mobile/app/(customer)/wallet/index.tsx" "apps/mobile/app/(customer)/wallet/rewards.tsx" "apps/mobile/__tests__/routes/(customer)/wallet/index.test.tsx" "apps/mobile/__tests__/routes/(customer)/wallet/rewards.test.tsx"
git commit -m "feat(mobile): customer wallet uses BalanceCard; drop fabricated Gold tier label"
```

---

### Task 11: Admin `BalanceCard` + `formatMoney` + token

**Files:**
- Create: `apps/admin/src/lib/money.ts`
- Test: `apps/admin/src/lib/money.test.ts`
- Create: `apps/admin/src/components/ui/BalanceCard.tsx`
- Test: `apps/admin/src/components/ui/BalanceCard.test.tsx`
- Modify: `apps/admin/src/app/globals.css` (`:root` and `.dark` in `@layer base`)

**Interfaces:**
- Produces:
  - `formatMoney(major: number, currency?: string): string`, the same output as mobile (`"GHS 1,250.00"`; `currency=""` gives `"1,250.00"`).
  - `BalanceCard({ label: string; available: number; held?: { label: string; amount: number; info?: string }; footnote?: string })`.
  - testIDs: `balance-amount`, `bar-available`, `bar-held`, `bar-empty`.
  - CSS var `--color-money-held`.

- [ ] **Step 1: Write the failing tests**

`apps/admin/src/lib/money.test.ts`:

```ts
import { formatMoney } from "./money";

describe("formatMoney (admin)", () => {
  it("matches the mobile format", () => {
    expect(formatMoney(1250)).toBe("GHS 1,250.00");
    expect(formatMoney(0.07)).toBe("GHS 0.07");
    expect(formatMoney(1000000)).toBe("GHS 1,000,000.00");
    expect(formatMoney(1250, "")).toBe("1,250.00");
    expect(formatMoney(-5)).toBe("GHS -5.00");
  });

  it("treats non-finite input as zero", () => {
    expect(formatMoney(Number.NaN)).toBe("GHS 0.00");
  });
});
```

`apps/admin/src/components/ui/BalanceCard.test.tsx`:

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { BalanceCard } from "./BalanceCard";

describe("BalanceCard (admin)", () => {
  it("renders the formatted available amount", () => {
    render(<BalanceCard label="Wallet" available={12480.5} />);
    expect(screen.getByTestId("balance-amount")).toHaveTextContent("12,480.50");
  });

  it("renders no bar or rows without held", () => {
    render(<BalanceCard label="Wallet" available={10} />);
    expect(screen.queryByTestId("bar-available")).toBeNull();
    expect(screen.queryByText("Available")).toBeNull();
  });

  it("renders a proportional bar and both rows with held", () => {
    render(
      <BalanceCard label="Wallet" available={300} held={{ label: "Held in escrow", amount: 100 }} />
    );
    expect(screen.getByTestId("bar-available").style.flexGrow).toBe("300");
    expect(screen.getByTestId("bar-held").style.flexGrow).toBe("100");
    expect(screen.getByText("Held in escrow")).toBeInTheDocument();
    expect(screen.getByText("GHS 300.00")).toBeInTheDocument();
    expect(screen.getByText("GHS 100.00")).toBeInTheDocument();
  });

  it("renders an empty track when both amounts are zero", () => {
    render(<BalanceCard label="Wallet" available={0} held={{ label: "Held", amount: 0 }} />);
    expect(screen.getByTestId("bar-empty")).toBeInTheDocument();
  });

  it("renders the footnote", () => {
    render(<BalanceCard label="Wallet" available={1} footnote="Lifetime earnings: GHS 9.00" />);
    expect(screen.getByText("Lifetime earnings: GHS 9.00")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd apps/admin && npx jest src/lib/money.test.ts src/components/ui/BalanceCard.test.tsx`
Expected: FAIL with "Cannot find module './money'" and "Cannot find module './BalanceCard'".

- [ ] **Step 3: Implement `formatMoney`**

`apps/admin/src/lib/money.ts`:

```ts
// Mirror of apps/mobile/src/lib/money.ts#formatMoney so both apps print money
// identically: "GHS 1,250.00". Integer pesewas internally to avoid float drift.
const MINOR = 100;

export function formatMoney(major: number, currency = "GHS"): string {
  const minor = Number.isFinite(major) ? Math.round(major * MINOR) : 0;
  const neg = minor < 0;
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / MINOR);
  const cents = abs % MINOR;
  const body = `${neg ? "-" : ""}${whole.toLocaleString("en-US")}.${String(cents).padStart(2, "0")}`;
  return currency ? `${currency} ${body}` : body;
}
```

- [ ] **Step 4: Add the admin token**

In `apps/admin/src/app/globals.css`, inside `@layer base`:
- In `:root`, directly after `    --color-primary-subtle: var(--color-brand-50);` add:
  ```css
      --color-money-held: var(--color-brand-300);
  ```
- In `.dark`, directly after `    --color-primary-subtle: var(--color-brand-950);` add:
  ```css
      --color-money-held: var(--color-brand-600);
  ```

- [ ] **Step 5: Implement the admin `BalanceCard`**

`apps/admin/src/components/ui/BalanceCard.tsx`:

```tsx
import React from "react";
import { formatMoney } from "../../lib/money";

export interface BalanceCardProps {
  label: string;
  available: number;
  held?: { label: string; amount: number; info?: string };
  footnote?: string;
}

// Web mirror of the mobile BalanceCard contract (docs/DESIGN-SYSTEM.md §0).
// Read-only: admins always see figures, so no hide toggle and no actions.
export function BalanceCard({ label, available, held, footnote }: BalanceCardProps) {
  const heldAmount = held?.amount ?? 0;
  const empty = available + heldAmount <= 0;

  return (
    <section
      aria-label={label}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 text-[var(--color-text)]"
    >
      <p className="text-xs font-bold text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 flex items-baseline gap-1 font-heading font-extrabold text-[var(--color-primary)] tabular-nums">
        <span className="text-base">GHS</span>
        <span className="text-3xl" data-testid="balance-amount">
          {formatMoney(available, "")}
        </span>
      </p>

      {held && (
        <>
          <div className="mt-4 flex h-1.5 gap-0.5" aria-hidden="true">
            {empty ? (
              <div data-testid="bar-empty" className="flex-1 rounded-full bg-[var(--color-border)]" />
            ) : (
              <>
                {available > 0 && (
                  <div
                    data-testid="bar-available"
                    className="rounded-full bg-[var(--color-primary)]"
                    style={{ flexGrow: available, flexBasis: 0 }}
                  />
                )}
                {heldAmount > 0 && (
                  <div
                    data-testid="bar-held"
                    className="rounded-full bg-[var(--color-money-held)]"
                    style={{ flexGrow: heldAmount, flexBasis: 0 }}
                  />
                )}
              </>
            )}
          </div>
          <dl className="mt-3 text-sm">
            <div className="flex justify-between py-2">
              <dt className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                Available
              </dt>
              <dd className="font-bold tabular-nums">{formatMoney(available)}</dd>
            </div>
            <div className="flex justify-between border-t border-[var(--color-border)] py-2">
              <dt
                className="flex items-center gap-2 text-[var(--color-text-secondary)]"
                title={held.info}
              >
                <span className="h-2 w-2 rounded-full bg-[var(--color-money-held)]" />
                {held.label}
              </dt>
              <dd className="font-bold tabular-nums">{formatMoney(heldAmount)}</dd>
            </div>
          </dl>
        </>
      )}

      {footnote && <p className="mt-2 text-xs text-[var(--color-text-muted)]">{footnote}</p>}
    </section>
  );
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd apps/admin && npx jest src/lib/money.test.ts src/components/ui/BalanceCard.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 7: Commit**

```bash
git add apps/admin/src/lib/money.ts apps/admin/src/lib/money.test.ts apps/admin/src/components/ui/BalanceCard.tsx apps/admin/src/components/ui/BalanceCard.test.tsx apps/admin/src/app/globals.css
git commit -m "feat(admin): add BalanceCard and formatMoney mirroring mobile"
```

---

### Task 12: Admin pages adopt `BalanceCard`

**Files:**
- Modify: `apps/admin/src/app/(dashboard)/users/[id]/page.tsx` (import line 10; wallet card lines 99–118)
- Modify: `apps/admin/src/app/(dashboard)/dispatchers/[id]/page.tsx` (imports; title line 142; tiles lines 155–162; insert the card after the Vehicle card)
- Modify: `apps/admin/src/lib/api/dispatchers.ts` (`DispatcherDetails`)

**Interfaces:**
- Consumes: admin `BalanceCard`, `formatMoney` (Task 11); server fields `user.wallet.heldInEscrow`, `user.vendorPendingClearance`, `dispatcher.walletBalance` (Task 5).

- [ ] **Step 1: Update the user detail page**

In `apps/admin/src/app/(dashboard)/users/[id]/page.tsx`, replace line 10:

```ts
import { formatCurrency } from "../../../../lib/utils";
```

with:

```ts
import { BalanceCard } from "../../../../components/ui/BalanceCard";
import { formatMoney } from "../../../../lib/money";
```

Replace the whole `{/* Wallet Card */}` block (the `<Card>` containing "Wallet Details", lines 99–118) with:

```tsx
          {/* Wallet */}
          <BalanceCard
            label="Wallet"
            available={Number(user.wallet?.balance ?? 0)}
            held={{
              label: "Held in escrow",
              amount: Number(user.wallet?.heldInEscrow ?? 0),
              info: "Paid into escrow for orders that haven't been delivered yet.",
            }}
            footnote={
              user.vendorProfile
                ? `Vendor pending clearance: ${formatMoney(Number(user.vendorPendingClearance ?? 0))}`
                : undefined
            }
          />
```

- [ ] **Step 2: Add `walletBalance` to the dispatcher type**

In `apps/admin/src/lib/api/dispatchers.ts`, inside `interface DispatcherDetails extends Dispatcher`, add after the `jobs: any[];` line:

```ts
  walletBalance: number;
```

- [ ] **Step 3: Update the dispatcher detail page**

In `apps/admin/src/app/(dashboard)/dispatchers/[id]/page.tsx`:

Add after the `Button` import (line 10):

```ts
import { BalanceCard } from "../../../../components/ui/BalanceCard";
import { formatMoney } from "../../../../lib/money";
```

Change the card title on line 142 from `Vehicle & Earnings` to `Vehicle`.

Delete the two earnings tiles (lines 155–162):

```tsx
                  <div className="rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-surface-50)]">
                    <p className="text-sm text-[var(--color-text-muted)]">Total Earnings</p>
                    <p className="text-lg font-bold text-[var(--color-success)]">GH₵ {dispatcher.totalEarnings}</p>
                  </div>
                  <div className="rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-surface-50)]">
                    <p className="text-sm text-[var(--color-text-muted)]">Pending Payout</p>
                    <p className="text-lg font-bold text-[var(--color-warning)]">GH₵ {dispatcher.pendingPayout}</p>
                  </div>
```

Directly after the closing `</Card>` of the Vehicle card, before the `<Card>` whose title is "Trip Statistics", insert:

```tsx
            <BalanceCard
              label="Wallet"
              available={Number(dispatcher.walletBalance ?? 0)}
              held={{
                label: "Pending payout",
                amount: Number(dispatcher.pendingPayout ?? 0),
                info: "Delivery payouts awaiting customer confirmation.",
              }}
              footnote={`Lifetime earnings: ${formatMoney(Number(dispatcher.totalEarnings ?? 0))}`}
            />
```

- [ ] **Step 4: Typecheck, lint and test admin**

Run: `cd apps/admin && npx tsc --noEmit && npx eslint "src/app/(dashboard)/users/[id]/page.tsx" "src/app/(dashboard)/dispatchers/[id]/page.tsx" src/components/ui/BalanceCard.tsx && npx jest`
Expected:
- no type errors (the `dispatcher` from `useDispatcher` must be typed `DispatcherDetails`; if tsc reports `walletBalance` missing on `Dispatcher`, the hook's return type is `Dispatcher`, so widen `getDispatcher`'s return type in `src/lib/api/dispatchers.ts` to `Promise<DispatcherDetails>`);
- eslint clean;
- all admin tests PASS.

- [ ] **Step 5: Commit**

```bash
git add "apps/admin/src/app/(dashboard)/users/[id]/page.tsx" "apps/admin/src/app/(dashboard)/dispatchers/[id]/page.tsx" apps/admin/src/lib/api/dispatchers.ts
git commit -m "feat(admin): user and dispatcher pages show BalanceCard with real held amounts"
```

---

### Task 13: Server — customer `heldInEscrow` on `GET /wallet` (GATED)

> **Gate:** do not start until background task `task_5f1292e8` ("Stop GET /wallet leaking pinHash and password hash") has merged to `main`. Then run `git merge main` on `feat/balance-card-redesign` and resolve any conflicts. That task changes what `GET /wallet` returns; this task adds one field on top of its sanitized shape.

**Files:**
- Modify: `apps/server/src/prisma/prisma.mock.ts` (escrow mock, line ~80–88)
- Modify: `apps/server/src/modules/wallet/wallet.service.ts` (new method)
- Modify: `apps/server/src/modules/wallet/wallet.service.spec.ts`
- Modify: `apps/server/src/modules/wallet/wallet.controller.ts` (`getWallet`)
- Modify: `apps/server/src/modules/wallet/wallet.controller.spec.ts`

**Interfaces:**
- Produces: `WalletService.getHeldInEscrow(walletId: string): Promise<number>`; `GET /wallet` response gains `heldInEscrow: number`. Mobile `useWallet()` already reads it (Task 10).

- [ ] **Step 1: Add `aggregate` to the shared prisma mock**

In `apps/server/src/prisma/prisma.mock.ts`, inside the `escrow: { ... }` object, after `count: jest.fn(),` add:

```ts
    aggregate: jest.fn(),
```

- [ ] **Step 2: Write the failing service test**

Add to `apps/server/src/modules/wallet/wallet.service.spec.ts`, inside `describe("WalletService")`:

```ts
  describe("getHeldInEscrow", () => {
    it("sums only HELD escrow the wallet paid in", async () => {
      prisma.escrow.aggregate.mockResolvedValue({ _sum: { amount: 180 } });
      await expect(service.getHeldInEscrow("w1")).resolves.toBe(180);
      expect(prisma.escrow.aggregate).toHaveBeenCalledWith({
        where: { buyerWalletId: "w1", status: "HELD" },
        _sum: { amount: true },
      });
    });

    it("returns 0 when nothing is held", async () => {
      prisma.escrow.aggregate.mockResolvedValue({ _sum: { amount: null } });
      await expect(service.getHeldInEscrow("w1")).resolves.toBe(0);
    });
  });
```

- [ ] **Step 3: Write the failing controller test**

In `apps/server/src/modules/wallet/wallet.controller.spec.ts`, add `getHeldInEscrow: jest.fn(),` to the `mockService` object, and replace the `describe("getWallet", ...)` block with:

```ts
  describe("getWallet", () => {
    it("returns the wallet with heldInEscrow", async () => {
      mockService.getWallet.mockResolvedValue({ id: "w1", balance: 1000 });
      mockService.getHeldInEscrow.mockResolvedValue(180);
      const req = { user: { id: "user-1" } } as AuthenticatedRequest;

      const result: any = await controller.getWallet(req);
      expect(result.balance).toBe(1000);
      expect(result.heldInEscrow).toBe(180);
      expect(mockService.getWallet).toHaveBeenCalledWith("user-1");
      expect(mockService.getHeldInEscrow).toHaveBeenCalledWith("w1");
    });
  });
```

If the merged security task changed `getWallet` in the controller to call a different service method (for example a sanitized `getPublicWallet`), mock that method in this test instead of `getWallet`. Keep its existing assertions that `pinHash` / `password` are absent, and add the two `heldInEscrow` assertions above.

- [ ] **Step 4: Run the tests to verify they fail**

Run: `cd apps/server && npx jest src/modules/wallet/wallet.service.spec.ts src/modules/wallet/wallet.controller.spec.ts -t "getHeldInEscrow|getWallet"`
Expected: FAIL. `service.getHeldInEscrow is not a function`; `heldInEscrow` is undefined.

- [ ] **Step 5: Implement the service method**

Add to `WalletService` in `apps/server/src/modules/wallet/wallet.service.ts`, directly after `getWallet`:

```ts
  /** Money this wallet has paid into escrow for orders not yet delivered. */
  async getHeldInEscrow(walletId: string): Promise<number> {
    const held = await this.prisma.escrow.aggregate({
      where: { buyerWalletId: walletId, status: "HELD" },
      _sum: { amount: true },
    });
    return Number(held._sum.amount ?? 0);
  }
```

- [ ] **Step 6: Implement the controller change**

In `apps/server/src/modules/wallet/wallet.controller.ts`, replace:

```ts
  getWallet(@Req() req: AuthenticatedRequest) {
    return this.walletService.getWallet(req.user.id);
  }
```

with:

```ts
  async getWallet(@Req() req: AuthenticatedRequest) {
    const wallet = await this.walletService.getWallet(req.user.id);
    const heldInEscrow = await this.walletService.getHeldInEscrow(wallet.id);
    return { ...wallet, heldInEscrow };
  }
```

If the merged security task already returns a sanitized object from this handler, keep its sanitizing call exactly and spread *its* result instead of `wallet`. For example: `const publicWallet = <its existing call>; return { ...publicWallet, heldInEscrow: await this.walletService.getHeldInEscrow(publicWallet.id) };`. Make sure the sanitized object still carries `id`; if it doesn't, fetch the id the same way the security task does.

- [ ] **Step 7: Run the wallet suites**

Run: `cd apps/server && npx jest src/modules/wallet`
Expected: PASS (all wallet specs, including the security task's leak assertions).

- [ ] **Step 8: Commit**

```bash
git add apps/server/src/prisma/prisma.mock.ts apps/server/src/modules/wallet/wallet.service.ts apps/server/src/modules/wallet/wallet.service.spec.ts apps/server/src/modules/wallet/wallet.controller.ts apps/server/src/modules/wallet/wallet.controller.spec.ts
git commit -m "feat(server): expose customer heldInEscrow on GET /wallet"
```

---

### Task 14: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Full test suites**

Run each and confirm it passes:

```bash
cd apps/mobile && npx jest
```
```bash
cd apps/admin && npx jest
```
```bash
cd apps/server && npx jest
```

Expected: all PASS. Mobile coverage thresholds in `jest.config.js` are still met.

- [ ] **Step 2: Typecheck all three apps**

```bash
cd apps/mobile && npx tsc --noEmit
```
```bash
cd apps/admin && npx tsc --noEmit
```
```bash
cd apps/server && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Design-system scan of new files**

Run from the repo root:

```bash
node scripts/check-design-system.mjs | grep -E "BalanceCard|EarningsStatTiles|lib/balance|lib/money|balance-visibility"
```

Expected: no output. New files have no raw hex, arbitrary values or shadows. Pre-existing hits in the rewritten screens' unchanged header and transaction-list lines are out of scope.

- [ ] **Step 4: Confirm no fake or legacy balance data remains**

Run from the repo root:

```bash
grep -rn "84.00 today\|Gold tier\|Gold Tier\|lockedBalance\|profile.pendingPayout" apps/mobile/app apps/admin/src apps/server/src/modules/vendor
```

Expected: no output.

- [ ] **Step 5: Manual check on a device or simulator**

Start the app with `cd apps/mobile && npx expo start`, then check:
- Customer → Wallet: card, split bar, ⓘ, Top up, the navy action row, and the unchanged amber coins strip.
- Vendor → Dashboard: compact card, "View earnings".
- Vendor → Earnings: full card and tiles.
- Rider → Earnings: full card, labelled Withdraw.
- Rider → Home while online: real "today" line.
- Hide balances on one screen, then confirm every other screen is masked after navigating.
- Airplane mode on a balance screen shows "Couldn't load your balance", and Retry recovers after reconnecting.

- [ ] **Step 6: Report**

Summarize the results of Steps 1–5 (the pass/fail count per suite and anything skipped). Hand off to superpowers:finishing-a-development-branch.
