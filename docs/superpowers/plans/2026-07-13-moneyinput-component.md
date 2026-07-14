# MoneyInput Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one reusable, integer-safe `MoneyInput` component (plus a `money.ts` util) and adopt it across the five mobile money screens, replacing five drifting hand-rolled "GHS 0.00" fields.

**Architecture:** A pure `money.ts` util does all parsing/rounding in integer pesewas (×100 → round → ÷100). `MoneyInput` is a controlled component whose public `value` is a GHS-major `number` (1:1 with the Prisma `Decimal` API) — it keeps an internal editing string, emits the parsed major number on change, and renders all money variants (chips, balance/insufficient error, fee/total, read-only display) from props.

**Tech Stack:** React Native / Expo, TypeScript, NativeWind (semantic token classes), `@testing-library/react-native` + Jest.

**Spec:** `docs/superpowers/specs/2026-07-13-moneyinput-component-design.md`

## Global Constraints

- Public `value` is a **GHS-major `number`** (e.g. `12.5`); all internal math goes through `money.ts` in integer pesewas. No `parseFloat` in component or screens. No conversion at the network boundary — API already speaks GHS majors.
- Style with **NativeWind semantic token classes only** (`text-foreground`, `border-border`, `border-error`, `text-primary`, `bg-primary-subtle`, `bg-background`, `bg-card`, `text-muted-foreground`, `text-display-lg/sm`, `text-body-*`, `text-caption`, `font-heading`, `font-body`). No raw hex in JSX. For RN color props that can't take a class, import from `@/theme/tokens` (e.g. `tokens.textDisabled`).
- Flat design: borders, never shadows. Active/selected state = **brand navy** (`border-primary` / `bg-primary-subtle` / `text-primary`), never the old blue `#1d4ed8`.
- No new dependencies. No form/validation library.
- Every new file has a co-located `.test.tsx`/`.test.ts`. `node scripts/check-design-system.mjs` must not gain violations.
- Run tests from `apps/mobile`. Single file: `npx jest <path> --watchAll=false`. Full mobile suite: `yarn test`.
- The mobile package has ~50 pre-existing unrelated `tsc` errors; do **not** gate on a clean full `tsc`. Gate on Jest passing and the touched files being type-correct.

---

### Task 1: `money.ts` util

**Files:**
- Create: `apps/mobile/src/lib/money.ts`
- Test: `apps/mobile/src/lib/money.test.ts`

**Interfaces:**
- Produces:
  - `toMinor(input: string | number): number` — integer pesewas.
  - `toMajor(minor: number): number` — GHS major number.
  - `formatMoney(major: number, currency?: string): string` — grouped, 2dp; `currency` default `"GHS"`, empty string omits the prefix.
  - `sanitizeInput(raw: string): string` — digits + one dot, max 2 decimals, no leading zeros.
  - `clampMoney(major: number, min?: number, max?: number): number`.
  - `toEditString(major: number): string` — ungrouped edit-buffer string; `0`/falsy → `""`.

- [x] **Step 1: Write the failing tests**

```ts
import {
  toMinor,
  toMajor,
  formatMoney,
  sanitizeInput,
  clampMoney,
  toEditString,
} from "./money";

describe("money", () => {
  describe("toMinor", () => {
    it("parses a decimal string to integer pesewas", () => {
      expect(toMinor("12.50")).toBe(1250);
      expect(toMinor("12.5")).toBe(1250);
      expect(toMinor("0.07")).toBe(7);
      expect(toMinor("100")).toBe(10000);
    });
    it("parses a number without float drift", () => {
      expect(toMinor(0.1 + 0.2)).toBe(30);
      expect(toMinor(7 * 1.1)).toBe(770);
    });
    it("ignores a third decimal", () => {
      expect(toMinor("1.239")).toBe(123);
    });
    it("returns 0 for empty or junk", () => {
      expect(toMinor("")).toBe(0);
      expect(toMinor(".")).toBe(0);
      expect(toMinor("abc")).toBe(0);
    });
  });

  describe("toMajor", () => {
    it("converts pesewas back to a major number", () => {
      expect(toMajor(1250)).toBe(12.5);
      expect(toMajor(7)).toBe(0.07);
    });
  });

  describe("formatMoney", () => {
    it("groups thousands and always shows 2dp", () => {
      expect(formatMoney(1250)).toBe("GHS 1,250.00");
      expect(formatMoney(0.07)).toBe("GHS 0.07");
      expect(formatMoney(1000000)).toBe("GHS 1,000,000.00");
    });
    it("omits the prefix when currency is empty", () => {
      expect(formatMoney(1250, "")).toBe("1,250.00");
    });
    it("honors a custom currency", () => {
      expect(formatMoney(5, "USD")).toBe("USD 5.00");
    });
  });

  describe("sanitizeInput", () => {
    it("strips non-numeric characters", () => {
      expect(sanitizeInput("1a2b3")).toBe("123");
    });
    it("keeps only the first dot and 2 decimals", () => {
      expect(sanitizeInput("1.2.3")).toBe("1.23");
      expect(sanitizeInput("1.239")).toBe("1.23");
    });
    it("strips leading zeros but preserves 0.x", () => {
      expect(sanitizeInput("007")).toBe("7");
      expect(sanitizeInput("0.5")).toBe("0.5");
    });
  });

  describe("clampMoney", () => {
    it("bounds to min and max", () => {
      expect(clampMoney(3, 5, 100)).toBe(5);
      expect(clampMoney(150, 5, 100)).toBe(100);
      expect(clampMoney(50, 5, 100)).toBe(50);
    });
  });

  describe("toEditString", () => {
    it("formats a value for the edit buffer without grouping", () => {
      expect(toEditString(1250)).toBe("1250.00");
      expect(toEditString(12.5)).toBe("12.50");
    });
    it("returns empty string for zero/falsy", () => {
      expect(toEditString(0)).toBe("");
    });
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `cd apps/mobile && npx jest src/lib/money.test.ts --watchAll=false`
Expected: FAIL — `Cannot find module './money'`.

- [x] **Step 3: Implement `money.ts`**

```ts
const MINOR = 100;

export function toMinor(input: string | number): number {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) return 0;
    return Math.round(input * MINOR);
  }
  const s = input.trim();
  if (!s || s === "." || s === "-") return 0;
  const neg = s.startsWith("-");
  const cleaned = s.replace(/[^0-9.]/g, "");
  const [intPart = "0", decPart = ""] = cleaned.split(".");
  const cents = (decPart + "00").slice(0, 2);
  const minor = (parseInt(intPart || "0", 10) || 0) * MINOR + (parseInt(cents, 10) || 0);
  return neg ? -minor : minor;
}

export function toMajor(minor: number): number {
  return Math.round(minor) / MINOR;
}

export function formatMoney(major: number, currency = "GHS"): string {
  const minor = toMinor(major);
  const neg = minor < 0;
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / MINOR);
  const cents = abs % MINOR;
  const body = `${neg ? "-" : ""}${whole.toLocaleString("en-US")}.${String(cents).padStart(2, "0")}`;
  return currency ? `${currency} ${body}` : body;
}

export function sanitizeInput(raw: string): string {
  let s = raw.replace(/[^0-9.]/g, "");
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
    const [intPart, decPart = ""] = s.split(".");
    s = intPart + "." + decPart.slice(0, 2);
  }
  if (s.length > 1 && s[0] === "0" && s[1] !== ".") {
    s = s.replace(/^0+/, "");
    if (s === "" || s[0] === ".") s = "0" + s;
  }
  return s;
}

export function clampMoney(major: number, min?: number, max?: number): number {
  let v = major;
  if (typeof min === "number" && v < min) v = min;
  if (typeof max === "number" && v > max) v = max;
  return v;
}

export function toEditString(major: number): string {
  if (!major) return "";
  const minor = toMinor(major);
  const neg = minor < 0;
  const abs = Math.abs(minor);
  return `${neg ? "-" : ""}${Math.floor(abs / MINOR)}.${String(abs % MINOR).padStart(2, "0")}`;
}
```

- [x] **Step 4: Run tests to verify they pass**

Run: `cd apps/mobile && npx jest src/lib/money.test.ts --watchAll=false`
Expected: PASS (all cases).

- [x] **Step 5: Commit**

```bash
git add apps/mobile/src/lib/money.ts apps/mobile/src/lib/money.test.ts
git commit -m "feat(money): integer-safe money util for amount fields"
```

---

### Task 2: `MoneyInput` component

**Files:**
- Create: `apps/mobile/src/components/ui/MoneyInput.tsx`
- Test: `apps/mobile/src/components/ui/MoneyInput.test.tsx`

**Interfaces:**
- Consumes: `toMinor`, `toMajor`, `toEditString`, `formatMoney`, `sanitizeInput` from `@/lib/money`; `tokens` from `@/theme/tokens`.
- Produces: `MoneyInput` (named export) + `MoneyInputProps`.

```ts
export interface MoneyInputProps {
  value: number;                          // GHS major units
  onChangeValue: (value: number) => void; // emits GHS major units
  currency?: string;                      // default "GHS"
  placeholder?: string;                   // default "0.00"
  balance?: number;                       // shows "Insufficient balance" when value > balance
  quickAmounts?: number[];                // chip row (major units)
  feeCalc?: (value: number) => number;    // renders Amount/Fee/Total
  mode?: "input" | "display";             // default "input"
  size?: "lg" | "md";                     // default "lg"
  align?: "left" | "center";              // default "left"
  min?: number;                           // shows "Minimum …" below min
  max?: number;                           // blocks input above max
  editable?: boolean;                     // default true
  autoFocus?: boolean;
  label?: string;
  error?: string;                         // overrides internal message
  testID?: string;
}
```

- [ ] **Step 1: Write the failing tests**

```tsx
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { MoneyInput } from "./MoneyInput";

describe("MoneyInput", () => {
  it("renders the currency prefix and placeholder", () => {
    const { getByText, getByPlaceholderText } = render(
      <MoneyInput value={0} onChangeValue={() => {}} testID="mi" />
    );
    expect(getByText("GHS")).toBeTruthy();
    expect(getByPlaceholderText("0.00")).toBeTruthy();
  });

  it("emits a major-unit number on change", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <MoneyInput value={0} onChangeValue={onChange} testID="mi" />
    );
    fireEvent.changeText(getByTestId("mi"), "12.50");
    expect(onChange).toHaveBeenLastCalledWith(12.5);
  });

  it("blocks input above max", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <MoneyInput value={0} onChangeValue={onChange} max={100} testID="mi" />
    );
    fireEvent.changeText(getByTestId("mi"), "150");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows insufficient-balance error and stays enabled", () => {
    const { getByText } = render(
      <MoneyInput value={500} onChangeValue={() => {}} balance={320.5} testID="mi" />
    );
    expect(getByText("Insufficient balance")).toBeTruthy();
  });

  it("shows a minimum message below min", () => {
    const { getByText } = render(
      <MoneyInput value={3} onChangeValue={() => {}} min={5} testID="mi" />
    );
    expect(getByText("Minimum GHS 5.00")).toBeTruthy();
  });

  it("lets an external error override the internal message", () => {
    const { getByText, queryByText } = render(
      <MoneyInput value={500} onChangeValue={() => {}} balance={1} error="Nope" testID="mi" />
    );
    expect(getByText("Nope")).toBeTruthy();
    expect(queryByText("Insufficient balance")).toBeNull();
  });

  it("renders quick-amount chips and sets the value on press", () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <MoneyInput value={0} onChangeValue={onChange} quickAmounts={[50, 100, 200]} testID="mi" />
    );
    fireEvent.press(getByText("+200"));
    expect(onChange).toHaveBeenCalledWith(200);
  });

  it("renders the fee/total breakdown from feeCalc", () => {
    const { getByText } = render(
      <MoneyInput value={100} onChangeValue={() => {}} feeCalc={() => 5} testID="mi" />
    );
    expect(getByText("Fee")).toBeTruthy();
    expect(getByText("GHS 105.00")).toBeTruthy();
  });

  it("renders read-only in display mode with no input", () => {
    const { getByText, queryByTestId } = render(
      <MoneyInput value={1284.5} onChangeValue={() => {}} mode="display" testID="mi" />
    );
    expect(getByText("1,284.50")).toBeTruthy();
    expect(queryByTestId("mi")?.props?.editable).not.toBe(true);
  });

  it("respects editable=false", () => {
    const { getByTestId } = render(
      <MoneyInput value={0} onChangeValue={() => {}} editable={false} testID="mi" />
    );
    expect(getByTestId("mi").props.editable).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/mobile && npx jest src/components/ui/MoneyInput.test.tsx --watchAll=false`
Expected: FAIL — `Cannot find module './MoneyInput'`.

- [ ] **Step 3: Implement `MoneyInput.tsx`**

```tsx
import { View, Text, TextInput, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { tokens } from "@/theme/tokens";
import { toMinor, toMajor, toEditString, formatMoney, sanitizeInput } from "@/lib/money";

export interface MoneyInputProps {
  value: number;
  onChangeValue: (value: number) => void;
  currency?: string;
  placeholder?: string;
  balance?: number;
  quickAmounts?: number[];
  feeCalc?: (value: number) => number;
  mode?: "input" | "display";
  size?: "lg" | "md";
  align?: "left" | "center";
  min?: number;
  max?: number;
  editable?: boolean;
  autoFocus?: boolean;
  label?: string;
  error?: string;
  testID?: string;
}

export function MoneyInput({
  value,
  onChangeValue,
  currency = "GHS",
  placeholder = "0.00",
  balance,
  quickAmounts,
  feeCalc,
  mode = "input",
  size = "lg",
  align = "left",
  min,
  max,
  editable = true,
  autoFocus,
  label,
  error,
  testID,
}: MoneyInputProps) {
  const [text, setText] = useState(() => toEditString(value));

  useEffect(() => {
    if (toMinor(text) !== toMinor(value)) {
      setText(toEditString(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const curCls = size === "lg" ? "text-display-sm" : "text-body-lg";
  const amtCls = size === "lg" ? "text-display-lg" : "text-display-sm";

  if (mode === "display") {
    return (
      <View className={`flex-row items-center gap-2 py-2 ${align === "center" ? "justify-center" : ""}`}>
        <Text className={`font-heading font-bold text-foreground ${curCls}`}>{currency}</Text>
        <Text className={`font-heading font-black text-foreground ${amtCls}`} testID={testID}>
          {formatMoney(value, "")}
        </Text>
      </View>
    );
  }

  const insufficient = typeof balance === "number" && toMinor(value) > toMinor(balance);
  const belowMin = typeof min === "number" && value > 0 && toMinor(value) < toMinor(min);
  const message = error ?? (insufficient ? "Insufficient balance" : belowMin ? `Minimum ${formatMoney(min!)}` : "");
  const hasError = !!message;

  const handleChange = (raw: string) => {
    const clean = sanitizeInput(raw);
    if (typeof max === "number" && toMinor(clean) > toMinor(max)) return;
    setText(clean);
    onChangeValue(toMajor(toMinor(clean)));
  };

  return (
    <View>
      {label ? (
        <Text className="text-body-md font-bold text-muted-foreground font-heading mb-2 ml-1">{label}</Text>
      ) : null}

      <View
        className={`flex-row items-center gap-2 rounded-2xl border bg-background ${size === "lg" ? "p-4" : "px-4 py-3"} ${hasError ? "border-error" : "border-border"} ${align === "center" ? "justify-center" : ""}`}
      >
        <Text className={`font-heading font-bold text-foreground ${curCls}`}>{currency}</Text>
        <TextInput
          testID={testID}
          value={text}
          onChangeText={handleChange}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={tokens.textDisabled}
          editable={editable}
          autoFocus={autoFocus}
          accessibilityLabel={`Amount in ${currency}`}
          className={`font-heading font-black text-foreground p-0 ${amtCls} ${align === "center" ? "text-center" : "flex-1"}`}
        />
      </View>

      <View className="min-h-[20px] mt-2">
        {message ? <Text className="text-caption font-bold text-error font-body ml-1">{message}</Text> : null}
      </View>

      {quickAmounts && quickAmounts.length > 0 ? (
        <View className="flex-row flex-wrap gap-3 mt-1">
          {quickAmounts.map((amt) => {
            const active = toMinor(value) === toMinor(amt);
            return (
              <Pressable
                key={amt}
                onPress={() => onChangeValue(amt)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className={`rounded-2xl border px-4 py-3 ${active ? "border-primary bg-primary-subtle" : "border-border bg-card"}`}
              >
                <Text className={`text-body-sm font-bold ${active ? "text-primary" : "text-muted-foreground"}`}>+{amt}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {feeCalc ? renderBreakdown(value, feeCalc(value > 0 ? value : 0) || 0) : null}
    </View>
  );
}

function renderBreakdown(amount: number, fee: number) {
  const feeShown = amount > 0 ? fee : 0;
  return (
    <View className="mt-4 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row justify-between py-1">
        <Text className="text-body-sm text-muted-foreground font-body">Amount</Text>
        <Text className="text-body-sm font-bold text-foreground">{formatMoney(amount)}</Text>
      </View>
      <View className="flex-row justify-between py-1">
        <Text className="text-body-sm text-muted-foreground font-body">Fee</Text>
        <Text className="text-body-sm font-bold text-foreground">{formatMoney(feeShown)}</Text>
      </View>
      <View className="flex-row justify-between pt-2 mt-1 border-t border-border">
        <Text className="text-body-md font-bold text-foreground">Total</Text>
        <Text className="text-body-md font-black text-foreground">{formatMoney(amount + feeShown)}</Text>
      </View>
    </View>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/mobile && npx jest src/components/ui/MoneyInput.test.tsx --watchAll=false`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/components/ui/MoneyInput.tsx apps/mobile/src/components/ui/MoneyInput.test.tsx
git commit -m "feat(ui): reusable MoneyInput amount field"
```

---

### Task 3: Migrate Top Up Wallet

**Files:**
- Modify: `apps/mobile/app/(customer)/wallet/topup.tsx`

**Interfaces:**
- Consumes: `MoneyInput` from `@/components/ui/MoneyInput`; `formatMoney` from `@/lib/money`.

- [ ] **Step 1: Convert state + imports**

Add imports near the other `ui` imports:
```tsx
import { MoneyInput } from "@/components/ui/MoneyInput";
import { formatMoney } from "@/lib/money";
```
Change amount state from string to number:
```tsx
const [amount, setAmount] = useState(0);
```
In `handleTopUp`, replace `const numAmount = parseFloat(amount);` with `const numAmount = amount;`.
In `handleAmountSelect`, change to `const handleAmountSelect = (val: number) => { Keyboard.dismiss(); setAmount(val); };` (or delete it and let `MoneyInput` handle chips — see Step 2).
Replace `const isValidAmount = parseFloat(amount || "0") > 0;` with `const isValidAmount = amount > 0;`.
In the success screen, replace `GHS {parseFloat(amount || "0").toFixed(2)}` with `{formatMoney(amount)}`.

- [ ] **Step 2: Replace the amount block + standalone chips**

Replace the label + amount `View` **and** the separate quick-amount chips `View` (the `AMOUNTS.map(...)` block) with a single `MoneyInput`:
```tsx
<MoneyInput
  label="Amount to add"
  value={amount}
  onChangeValue={setAmount}
  quickAmounts={AMOUNTS}
  min={5}
  size="lg"
/>
```
Delete the now-unused `handleAmountSelect` and the old `AMOUNTS.map` chip block.

- [ ] **Step 3: Update the CTA label**

Replace the button title:
```tsx
title={isProcessing ? "Processing..." : `Top up ${formatMoney(amount)}`}
```

- [ ] **Step 4: Run the screen's tests + typecheck the file**

Run: `cd apps/mobile && npx jest app/\(customer\)/wallet --watchAll=false`
Expected: PASS or "no tests" for this screen; no new failures.
Run: `cd apps/mobile && npx tsc --noEmit -p tsconfig.json 2>&1 | grep topup.tsx || echo "no topup errors"`
Expected: `no topup errors`.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app/\(customer\)/wallet/topup.tsx
git commit -m "refactor(wallet): adopt MoneyInput in Top Up"
```

---

### Task 4: Migrate Send Money (transfer)

**Files:**
- Modify: `apps/mobile/app/(customer)/wallet/transfer.tsx`

- [ ] **Step 1: Convert state + imports**

Add:
```tsx
import { MoneyInput } from "@/components/ui/MoneyInput";
import { formatMoney } from "@/lib/money";
```
Change `const [amount, setAmount] = useState("");` → `const [amount, setAmount] = useState(0);`.
`balance` already exists: `const balance = walletData?.balance ?? 0;`.
Replace every `parseFloat(amount)` / `parseFloat(amount || "0")` with `amount`:
- `handleTransfer`: `const numAmount = amount;`
- `confirmTransfer`: `validate({ recipient, amount, pin })` and `transferMutation.mutateAsync({ email: recipient, amount, pin })`.
- Derived block: `const numAmount = amount; const isInsufficient = numAmount > balance; const isValidAmount = numAmount > 0 && !isInsufficient;`
- Success screen: replace `GHS {parseFloat(amount || "0").toFixed(2)}` with `{formatMoney(amount)}`.

- [ ] **Step 2: Replace the amount block**

Replace the label + bordered amount `View` + the manual `isInsufficient` message block with:
```tsx
<MoneyInput
  label="Send amount"
  value={amount}
  onChangeValue={setAmount}
  balance={balance}
  size="lg"
/>
```

- [ ] **Step 3: Update the CTA label**

```tsx
title={isProcessing ? "Processing..." : `Send ${formatMoney(amount)}`}
```

- [ ] **Step 4: Run + typecheck**

Run: `cd apps/mobile && npx jest app/\(customer\)/wallet --watchAll=false`
Expected: no new failures.
Run: `cd apps/mobile && npx tsc --noEmit -p tsconfig.json 2>&1 | grep transfer.tsx || echo "no transfer errors"`
Expected: `no transfer errors`.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app/\(customer\)/wallet/transfer.tsx
git commit -m "refactor(wallet): adopt MoneyInput in Send Money"
```

---

### Task 5: Migrate Request Money

**Files:**
- Modify: `apps/mobile/app/(customer)/wallet/request.tsx`

- [ ] **Step 1: Convert state + imports**

Add:
```tsx
import { MoneyInput } from "@/components/ui/MoneyInput";
import { formatMoney } from "@/lib/money";
```
Change `const [amount, setAmount] = useState("");` → `const [amount, setAmount] = useState(0);`.
`handleRequest`: `const numAmount = amount;` and success toast `You requested ${formatMoney(numAmount)} from ${contact}.`.
Derived: `const numAmount = amount; const isValidAmount = numAmount > 0;`.

- [ ] **Step 2: Replace the amount block**

Replace the "Request Amount" label + amount `View` (lines with `GHS` + `TextInput`) with:
```tsx
<MoneyInput
  label="Request amount"
  value={amount}
  onChangeValue={setAmount}
  size="lg"
/>
```
(No balance cap — a request is what you ask for, so "insufficient" never applies.)

- [ ] **Step 3: Update the CTA label**

```tsx
title={`Request ${formatMoney(amount)}`}
```

- [ ] **Step 4: Run + typecheck**

Run: `cd apps/mobile && npx jest app/\(customer\)/wallet --watchAll=false`
Expected: no new failures.
Run: `cd apps/mobile && npx tsc --noEmit -p tsconfig.json 2>&1 | grep request.tsx || echo "no request errors"`
Expected: `no request errors`.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app/\(customer\)/wallet/request.tsx
git commit -m "refactor(wallet): adopt MoneyInput in Request Money"
```

---

### Task 6: Migrate Vendor Withdraw

**Files:**
- Modify: `apps/mobile/app/(vendor)/(earnings)/withdraw.tsx`

**Note:** This screen keeps its own bespoke "Summary" receipt card, "Available" chip, and "Withdraw Max" button. Only the inner amount input changes — do **not** add `feeCalc` here (the screen already renders its own summary).

- [ ] **Step 1: Convert state + imports**

Add:
```tsx
import { MoneyInput } from "@/components/ui/MoneyInput";
import { formatMoney } from "@/lib/money";
```
Change `const [amount, setAmount] = useState("");` → `const [amount, setAmount] = useState(0);`.
Replace `const numAmount = parseFloat(amount) || 0;` with `const numAmount = amount;`.
`handleWithdrawRequest`: change guard `if (!amount || numAmount <= 0)` → `if (numAmount <= 0)`.
`handleMaxAmount`: `setAmount(Math.max(0, availableBalance - 5));`.
CTA `disabled={numAmount <= 0}` stays valid (numAmount is now `amount`).

- [ ] **Step 2: Replace the inner amount input**

Replace the inner centered input block:
```tsx
<View className="items-center justify-center py-4">
  <View className="flex-row items-center justify-center">
    <Text className="text-display-md font-black text-muted-foreground mr-2 mt-1">GHS</Text>
    <TextInput ... value={amount} onChangeText={setAmount} ... />
  </View>
</View>
```
with:
```tsx
<View className="py-2">
  <MoneyInput value={amount} onChangeValue={setAmount} size="lg" align="center" autoFocus />
</View>
```

- [ ] **Step 3: Update the CTA label**

```tsx
title={`Withdraw ${formatMoney(numAmount)}`}
```

- [ ] **Step 4: Run + typecheck**

Run: `cd apps/mobile && npx jest app/\(vendor\) --watchAll=false`
Expected: no new failures.
Run: `cd apps/mobile && npx tsc --noEmit -p tsconfig.json 2>&1 | grep "(earnings)/withdraw.tsx" || echo "no vendor withdraw errors"`
Expected: `no vendor withdraw errors`.

- [ ] **Step 5: Commit**

```bash
git add "apps/mobile/app/(vendor)/(earnings)/withdraw.tsx"
git commit -m "refactor(vendor): adopt MoneyInput in withdraw"
```

---

### Task 7: Migrate Dispatcher Withdraw

**Files:**
- Modify: `apps/mobile/app/(dispatcher)/(tabs)/(earnings)/withdraw.tsx`

**Note:** Same structure as vendor withdraw; `availableBalance = earnings?.pendingClearance ?? 0`. Keep the Summary card; do not add `feeCalc`.

- [ ] **Step 1: Convert state + imports**

Add:
```tsx
import { MoneyInput } from "@/components/ui/MoneyInput";
import { formatMoney } from "@/lib/money";
```
Change `const [amount, setAmount] = useState("");` → `const [amount, setAmount] = useState(0);`.
Replace `const numAmount = parseFloat(amount) || 0;` with `const numAmount = amount;`.
`handleWithdrawRequest`: `if (!amount || numAmount <= 0)` → `if (numAmount <= 0)`.
`handleMaxAmount`: `setAmount(Math.max(0, availableBalance - 5));`.

- [ ] **Step 2: Replace the inner amount input**

Replace the inner centered input block (the `GHS` `Text` + `TextInput value={amount}`) with:
```tsx
<View className="py-2">
  <MoneyInput value={amount} onChangeValue={setAmount} size="lg" align="center" autoFocus />
</View>
```

- [ ] **Step 3: Update the CTA label**

```tsx
title={`Withdraw ${formatMoney(numAmount)}`}
```

- [ ] **Step 4: Run + typecheck**

Run: `cd apps/mobile && npx jest app/\(dispatcher\) --watchAll=false`
Expected: no new failures.
Run: `cd apps/mobile && npx tsc --noEmit -p tsconfig.json 2>&1 | grep "(earnings)/withdraw.tsx" || echo "no dispatcher withdraw errors"`
Expected: `no dispatcher withdraw errors`.

- [ ] **Step 5: Commit**

```bash
git add "apps/mobile/app/(dispatcher)/(tabs)/(earnings)/withdraw.tsx"
git commit -m "refactor(dispatcher): adopt MoneyInput in withdraw"
```

---

### Task 8: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full mobile test suite**

Run: `cd apps/mobile && yarn test`
Expected: PASS, including `money.test.ts` and `MoneyInput.test.tsx`; no regressions in existing suites.

- [ ] **Step 2: Confirm no new design-system violations**

Run: `node scripts/check-design-system.mjs`
Expected: violation count unchanged from the 977-line baseline (no new hex/shadow/off-scale entries in the touched files).

- [ ] **Step 3: Grep for leftover float parsing in the migrated screens**

Run: `cd apps/mobile && grep -rn "parseFloat" app/\(customer\)/wallet app/\(vendor\)/\(earnings\)/withdraw.tsx "app/(dispatcher)/(tabs)/(earnings)/withdraw.tsx"`
Expected: no matches in the five migrated screens.

- [ ] **Step 4: Smoke-test in the app (optional but recommended)**

Launch the app, open Top Up / Send / Request / a Withdraw screen, type an amount, tap a chip, exceed the balance on Send, and confirm formatting + insufficient error + CTA label behave as in the prototype.

- [ ] **Step 5: Final commit (if any verification fixups were needed)**

```bash
git add -A
git commit -m "test(money): verify MoneyInput rollout across money screens"
```

---

## Self-Review

- **Spec coverage:** number model → Task 1; component + all states → Task 2; 5 migrations → Tasks 3–7; design-scanner + tests → Task 8; brand-navy active state → Task 2 chip classes; display mode → Task 2. Covered.
- **Types consistent:** `value:number`/`onChangeValue:(v:number)=>void`, `toMinor/toMajor/toEditString/formatMoney/sanitizeInput` names match across Tasks 1–7.
- **No placeholders:** every code step shows complete code; every run step shows the command + expected output.
- **Deferred deliberately:** admin twin, non-input `GHS ${x}` display sites, multi-currency — per spec "Out of scope".
