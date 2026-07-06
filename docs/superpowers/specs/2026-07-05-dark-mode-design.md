# Dark Mode — Design Spec

- **Date:** 2026-07-05
- **Status:** Approved (design) — pending implementation plan
- **Scope:** Bexiemart mobile app (customer + vendor + dispatcher) first; admin portal second
- **Author:** brainstormed with Claude

## 1. Goal & Decisions

Add a full dark theme across all Bexiemart apps.

Decisions made during brainstorming:

1. **Theme control:** three-way — **Light / Dark / System**. Defaults to following the OS; the user can pin light or dark. (Modern standard: WhatsApp/Instagram/X.)
2. **Rollout:** **mobile first, admin second.** One shared palette; mobile lands fully before admin gets the same treatment.
3. **Persistence:** **device-local only** — AsyncStorage on mobile, `localStorage` on admin. Works for guests (mobile has guest mode), instant on cold start, no server/schema changes. Theme is a device preference, not an account setting.

Non-goals: server-synced theme, per-role theming, custom user-authored themes, scheduled/auto dark at night.

## 2. Current State (what already exists)

The **semantic CSS-variable foundation for dark mode already exists** and is currently dormant:

- **Mobile** [`apps/mobile/global.css`](../../../apps/mobile/global.css): a full `@media (prefers-color-scheme: dark)` block **and** a `.dark { --color-* }` class override block (lines ~114–166) with a complete dark palette, plus `.dark .glass`. Tailwind `darkMode: "class"`, NativeWind `^4.1.23`, Tailwind `^3.4.17`, Expo `~54`, RN `0.81`.
- **Admin** [`apps/admin/src/app/globals.css`](../../../apps/admin/src/app/globals.css): a `.dark { --color-* }` override block (lines ~83–93). Next `16`, Tailwind `^4` (CSS-first `@theme`), recharts `^2.12`. `next-themes` **not** installed.
- **Mobile is locked to light:** [`app.json`](../../../apps/mobile/app.json) has `"userInterfaceStyle": "light"`, so the `@media` dark block never triggers today (no latent half-dark bug).

### The core problem — JS-prop colors

[`apps/mobile/src/theme/tokens.ts`](../../../apps/mobile/src/theme/tokens.ts) is a **static, light-only hex mirror** of the CSS variables. It exists because NativeWind only resolves `var(--…)` inside `className`, not in React Native JS props (`color=`, `style={{ backgroundColor }}`, `ActivityIndicator`, icon colors, gradients). CSS classes flip for free under `.dark`; **everything driven by `tokens.ts` does not.**

### Scope measured (mobile)

- **70 files** import `theme/tokens` (static-hex JS-prop colors → migrate to a dynamic hook).
- **311 literal light-assuming classes** (`bg-white`, `bg-slate-*`, `text-slate-*`, `bg-gray-*`, `text-black`, …) across **82 files**. Concentrated in wallet/cards (add 25, edit 22, cards 17, wallet 17, link-account bank/momo 13 each ≈ 120 total). Many `text-white` (reels overlays, navy buttons, gradients) are **intentional** and stay.
- `StatusBar`: centralized in [`app/_layout.tsx`](../../../apps/mobile/app/_layout.tsx) (one place).
- `LinearGradient`: 11 files (wallet cards, login, CoverHeader, onboarding, product, flash-sales, rewards).

## 3. Architecture (mobile)

Four units, each with one job:

### 3.1 `theme-store.ts` (zustand + AsyncStorage persist)

Mirrors the existing `auth-store` persistence pattern.

```ts
type ThemePreference = "light" | "dark" | "system";
interface ThemeState {
  preference: ThemePreference; // the ONLY persisted value
  setPreference: (p: ThemePreference) => void;
}
```

The user's **choice** is the single source of truth. The **resolved** scheme is derived, never stored:
`resolved = preference === "system" ? Appearance.getColorScheme() ?? "light" : preference`.

### 3.2 `ThemeController` (headless, mounted in `app/_layout.tsx`)

The only unit that talks to NativeWind's `colorScheme`. On boot: reads persisted preference, calls `colorScheme.set(resolved)`. Subscribes to `Appearance.addChangeListener` so `system` mode reacts live to OS changes. Unsubscribes on unmount.

### 3.3 `useThemeColors()` (JS-prop bridge)

```ts
import { useColorScheme } from "nativewind";
export function useThemeColors() {
  const { colorScheme } = useColorScheme(); // reactive
  return colorScheme === "dark" ? darkTokens : lightTokens;
}
export function getThemeColors(scheme: "light" | "dark") {
  return scheme === "dark" ? darkTokens : lightTokens;
} // non-React callers (stores, utils)
```

Migration shape: `color={tokens.primary}` → `const c = useThemeColors(); color={c.primary}`.

### 3.4 CSS layer (already done)

`colorScheme.set("dark")` activates the existing `.dark { --color-* }` block, flipping every `bg-background` / `bg-card` / `text-foreground` / `border-border` for free. Enablement flips `app.json` → `"userInterfaceStyle": "automatic"`.

**Gate (Phase 0 spike):** confirm NativeWind 4.1 honors the `.dark` var-override block on native (vs requiring `dark:` variant utilities). ~85% confidence. If it fails, `useThemeColors` still works and we fall back to a class-injection approach; low blast radius.

## 4. Token split & palette

`tokens.ts` splits into `lightTokens` (today's values) + `darkTokens`, with `export const tokens = lightTokens` kept as an **alias** so nothing breaks mid-migration. `darkTokens` mirrors the already-decided `.dark` CSS palette:

| token | light | dark | source |
|---|---|---|---|
| `primary` | `#06406b` | `#5193c6` | brand-400 (lighter for contrast on dark) |
| `primaryHover` | `#04365b` | `#88b7da` | brand-300 |
| `primaryActive` | `#022d4d` | `#b9d5ea` | brand-200 |
| `primarySubtle` | `#f0f7fb` | `#022d4d` | brand-900 |
| `secondary` | `#0ea5e9` | `#38bdf8` | accent-400 |
| `background` | `#F8FAFC` | `#020617` | surface-950 |
| `surface` | `#ffffff` | `#0F172A` | surface-900 |
| `border` | `#E2E8F0` | `#334155` | surface-700 |
| `textPrimary` | `#0F172A` | `#F8FAFC` | surface-50 |
| `textSecondary` | `#475569` | `#CBD5E1` | surface-300 |
| `textMuted` | `#94A3B8` | `#64748B` | surface-500 |
| `textDisabled` | `#CBD5E1` | `#475569` | surface-600 |
| `success` / `error` / `warning` | unchanged | unchanged | feedback colors read fine on dark |

Light and dark stay in lockstep by construction: one palette, two consumers (CSS vars for classes, `tokens` for JS props). If a value changes, update both `global.css` and `tokens.ts` together.

## 5. Mobile edge surfaces (non-CSS)

Surfaces that ignore CSS vars and need explicit handling:

| Surface | Where | Fix |
|---|---|---|
| StatusBar | `app/_layout.tsx` (1) | `<StatusBar style="auto" />` — flips text with scheme |
| Splash screen | `app.json` `#FFFFFF` bg | add `splash.dark.backgroundColor` (`#020617`) + dark image; verify `AnimatedSplashScreen` container bg |
| Tab bars | both `(tabs)/_layout.tsx` | `backgroundColor:"#FFFFFF"` + border + active/inactive icon colors → hook |
| GlobalPopup / Toast | `GlobalPopup.tsx` `#ffffff`, `toast-polyfill` | surface + text colors → hook |
| Icon default | `Icon.tsx` default `color="#0f172a"` | default to `useThemeColors().textPrimary` (invisible-on-dark risk otherwise) |
| Skeleton / Loading / ActivityIndicator | components sourcing `tokens` | → hook |
| Maps | `NativeMap` (react-native-maps) | apply a dark map-style JSON when scheme is dark |
| Gradients | 11 files | brand-navy gradients are fine on dark; audit the few fading to white (login, CoverHeader, onboarding) for dark stops |
| keyboardAppearance | TextInputs | set to scheme (optional polish) |

## 6. Admin (Phase 4)

- Install **`next-themes`**: `ThemeProvider attribute="class" defaultTheme="system" enableSystem` in root layout; `suppressHydrationWarning` on `<html>`. Injects an inline script → **no FOUC**, handles system + `localStorage` persistence.
- **Toggle** in the dashboard top bar (light/dark/system).
- **Tailwind v4:** semantic classes read vars that flip under `.dark`, so most works once the class is on `<html>`. Add `@custom-variant dark (&:where(.dark, .dark *))` to `globals.css` so explicit `dark:` utilities resolve.
- **recharts:** series/axis/grid colors are hardcoded hex arrays passed as props — add a theme-aware chart palette (admin's equivalent of the `tokens.ts` problem).
- Remediate admin literal-class debt (`bg-white`, `text-slate-*`), same pattern as mobile.

## 7. Phasing (build ≠ enable; flag-gated like guest-mode)

Enabling `"automatic"` before the debt is fixed would ship broken half-dark screens to dark-phone users. So building is decoupled from enabling via a PostHog `darkModeEnabled` flag (default **off**), matching the guest-mode rollout pattern.

- **Phase 0 — Spike (gate, ~30 min).** Prove NativeWind honors the `.dark` var block on device. Throwaway. Adjust token strategy if it fails.
- **Phase 1 — Foundation (1 PR).** `theme-store`, `ThemeController`, `useThemeColors` + token split, `StatusBar style="auto"`, the real 3-way Profile control replacing the "Coming soon" row — all behind the flag (default off); `app.json` stays `"light"`. Manual toggle works in dev. Zero user-visible change.
- **Phase 2 — Remediation (several small PRs, one per area).** Convert accidental literals + migrate JS-prop colors, in leverage order:
  1. Shared components (Button, Card, Icon, inputs, StatusBanner, Loading/Empty/Error, Skeleton, OrderCard, Avatar, GlobalPopup, Toast, tab bars)
  2. Customer core (home, shop, profile, cart, checkout, orders, search, notifications)
  3. Wallet cluster (heaviest, ~120 occurrences)
  4. Vendor
  5. Dispatcher
  6. Auth / onboarding

  Each PR verified in dark via manual toggle. Intentional `text-white` left alone — surgical, not blanket.
- **Phase 3 — Enable (1 PR).** Edge surfaces (splash dark config, map dark style, gradient audit, keyboardAppearance), flip `app.json → "automatic"` **and** turn the flag on. Full QA sweep.
- **Phase 4 — Admin (separate PRs).** next-themes + toggle + `@custom-variant` + recharts palette + admin debt.

## 8. Testing

- **Spike (Phase 0):** manual, throwaway.
- **Unit:** `theme-store` (preference persists; resolved-scheme logic; `Appearance` change → `colorScheme.set`); `useThemeColors`/`getThemeColors` return correct palette per scheme. Add a nativewind `colorScheme` + `Appearance` mock to `jest.setup.js`.
- **Component:** render a few shared components under both schemes; assert no light-leak (e.g. Icon default follows theme). Existing **129 component tests stay green** because the `tokens = lightTokens` alias preserves current behavior.
- **Contrast:** a test asserting WCAG-AA ratios for dark pairs (textPrimary/background, textMuted/surface, primary/surface).
- **Manual QA matrix:** per-area smoke (light + dark) during Phase 2; full iOS + Android × guest + member sweep in Phase 3. No snapshot churn (0 snapshot tests exist).

## 9. Risks

- **NativeWind `.dark` var honoring** (Phase 0 gate) — the linchpin. Mitigated by spike-first.
- **Scope creep in Phase 2** — 82 files. Mitigated by per-area PRs and leaving intentional literals alone.
- **Interim broken-dark** if `"automatic"` is flipped early — mitigated by flag gating + keeping `app.json` light until Phase 3.
- **Gradient/map polish** — brand gradients mostly fine; a handful need dark stops (caught in Phase 3 audit).
