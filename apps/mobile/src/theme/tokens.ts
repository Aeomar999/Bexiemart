/**
 * Resolved hex values for the semantic design tokens defined in `global.css`.
 *
 * Why this file exists:
 * NativeWind only resolves CSS custom properties (`var(--…)`) inside `className`
 * strings. When a `var(--…)` is passed to a React Native JS prop — `color=`,
 * `style={{ backgroundColor }}`, `ActivityIndicator color`, icon `color`, etc. —
 * React Native's color parser cannot understand it and the color silently falls
 * back to the platform default. Always import the values below for prop-level
 * colors; keep `var(--…)` for `className` only.
 *
 * Single source of truth for brand colour: change `primary` here and every
 * native-prop usage updates. Mirrors the `--color-*` semantic layer in
 * `global.css` (brand-700 = #06406b).
 */
export const tokens = {
  // Brand / primary
  primary: "#06406b", // --color-primary  (brand-700)
  primaryHover: "#04365b", // --color-primary-hover  (brand-800)
  primaryActive: "#022d4d", // --color-primary-active (brand-900)
  primarySubtle: "#f0f7fb", // --color-primary-subtle (brand-50)
  primaryText: "#ffffff", // --color-primary-text

  // Secondary / accent
  secondary: "#0ea5e9", // --color-secondary (accent-500)
  secondaryHover: "#0284c7", // --color-secondary-hover (accent-600)
  secondaryText: "#ffffff", // --color-secondary-text

  // Feedback
  success: "#00D084", // --color-success
  error: "#EF4444", // --color-error
  warning: "#F59E0B", // --color-warning

  // Surfaces & text
  background: "#F8FAFC", // --color-background (surface-50)
  surface: "#ffffff", // --color-surface
  border: "#E2E8F0", // --color-border (surface-200)
  textPrimary: "#0F172A", // --color-text-primary (surface-900)
  textSecondary: "#475569", // --color-text-secondary (surface-600)
  textMuted: "#94A3B8", // --color-text-muted (surface-400)
  textDisabled: "#CBD5E1", // --color-text-disabled (surface-300)
} as const;

export type TokenKey = keyof typeof tokens;
