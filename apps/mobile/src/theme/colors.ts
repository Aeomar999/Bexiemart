// Canonical Bexiemart palette — mirrors the primitive scales in global.css.
// Brand = Navy (#06406b @ 700), Accent = Sky (#0ea5e9 @ 500).
export const colors = {
  brand: {
    50: "#f0f7fb",
    100: "#dbeaf5",
    200: "#b9d5ea",
    300: "#88b7da",
    400: "#5193c6",
    500: "#2c75a9",
    600: "#1b5b8b",
    700: "#06406b",
    800: "#04365b",
    900: "#022d4d",
    950: "#011d35",
  },
  accent: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9",
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
    950: "#082f49",
  },
  surface: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
    950: "#020617",
  },
  success: { DEFAULT: "#00D084", light: "#E6F9F3" },
  error: { DEFAULT: "#EF4444", light: "#FEF2F2" },
  warning: { DEFAULT: "#F59E0B", light: "#FFFBEB" },
} as const;

export type ColorKey = keyof typeof colors;
