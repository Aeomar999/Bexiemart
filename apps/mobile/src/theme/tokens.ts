/**
 * Resolved hex values for the semantic design tokens defined in `global.css`.
 *
 * Why this file exists:
 * NativeWind only resolves CSS custom properties (`var(--…)`) inside `className`
 * strings. When a `var(--…)` is passed to a React Native JS prop — `color=`,
 * `style={{ backgroundColor }}`, `ActivityIndicator color`, icon `color`, etc. —
 * React Native's color parser cannot understand it and the color silently falls
 * back to the platform default. Always import these values for prop-level
 * colors; keep `var(--…)` for `className` only.
 *
 * Dark mode:
 * `lightTokens` and `darkTokens` mirror the `:root` and `.dark` blocks in
 * `global.css` respectively — one palette, two consumers (CSS vars for classes,
 * these hexes for JS props). Components that need prop-level colors should read
 * the active palette via `useThemeColors()` rather than importing a static set.
 * `tokens` remains as a light-only alias for not-yet-migrated call sites.
 */

export const lightTokens = {
  // Brand / primary
  primary: "#06406b", // brand-700
  primaryHover: "#04365b", // brand-800
  primaryActive: "#022d4d", // brand-900
  primarySubtle: "#f0f7fb", // brand-50
  primaryText: "#ffffff",

  // Secondary / accent
  secondary: "#0ea5e9", // accent-500
  secondaryHover: "#0284c7", // accent-600
  secondaryText: "#ffffff",

  // Feedback
  success: "#00D084",
  error: "#EF4444",
  warning: "#F59E0B",

  // Surfaces & text
  background: "#F8FAFC", // surface-50
  surface: "#ffffff",
  border: "#E2E8F0", // surface-200
  textPrimary: "#0F172A", // surface-900
  textSecondary: "#475569", // surface-600
  textMuted: "#94A3B8", // surface-400
  textDisabled: "#CBD5E1", // surface-300
} as const;

export type ColorScheme = "light" | "dark";
export type ThemeColors = { readonly [K in keyof typeof lightTokens]: string };

export const darkTokens: ThemeColors = {
  // Brand / primary — lighter brand steps for contrast on dark surfaces
  primary: "#5193c6", // brand-400
  primaryHover: "#88b7da", // brand-300
  primaryActive: "#b9d5ea", // brand-200
  primarySubtle: "#022d4d", // brand-900
  primaryText: "#ffffff",

  // Secondary / accent
  secondary: "#38bdf8", // accent-400
  secondaryHover: "#7dd3fc", // accent-300
  secondaryText: "#ffffff",

  // Feedback — read fine on dark, unchanged
  success: "#00D084",
  error: "#EF4444",
  warning: "#F59E0B",

  // Surfaces & text — inverted scale
  background: "#020617", // surface-950
  surface: "#0F172A", // surface-900
  border: "#334155", // surface-700
  textPrimary: "#F8FAFC", // surface-50
  textSecondary: "#CBD5E1", // surface-300
  textMuted: "#64748B", // surface-500
  textDisabled: "#475569", // surface-600
};

/** Return the resolved palette for a concrete scheme (non-React callers). */
export function getThemeColors(scheme: ColorScheme): ThemeColors {
  return scheme === "dark" ? darkTokens : lightTokens;
}

/**
 * Backward-compatible alias. Existing `import { tokens }` call sites keep the
 * light palette until they migrate to `useThemeColors()`. Prefer the hook for
 * any new code so colors react to the active scheme.
 */
export const tokens = lightTokens;

export type TokenKey = keyof typeof lightTokens;
