import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * The user's theme choice. `system` follows the OS appearance; `light`/`dark`
 * pin the app regardless of the OS. This is the ONLY persisted value — the
 * effective light/dark scheme is derived at runtime via {@link resolveScheme}.
 */
export type ThemePreference = "light" | "dark" | "system";
export type ColorScheme = "light" | "dark";

const STORAGE_KEY = "bexiemart_theme_preference";

/**
 * Resolve a concrete light/dark scheme from the user's preference and the
 * current OS appearance. Pure and side-effect free so it can be unit-tested and
 * reused by non-React callers.
 */
export function resolveScheme(
  preference: ThemePreference,
  systemScheme: ColorScheme | null | undefined
): ColorScheme {
  if (preference === "system") return systemScheme === "dark" ? "dark" : "light";
  return preference;
}

function isValidPreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

interface ThemeState {
  /** The user's saved choice. Defaults to `system` until hydrated. */
  preference: ThemePreference;
  /** True once the persisted preference has been read from storage. */
  hydrated: boolean;
  /** Set + persist the preference. NativeWind is driven separately by ThemeController. */
  setPreference: (preference: ThemePreference) => void;
  /** Read the persisted preference from AsyncStorage (called once on boot). */
  hydrate: () => Promise<void>;
}

/**
 * Device-local theme preference store. Mirrors the manual persist pattern of
 * `auth-store` (no middleware): a `hydrate()` action reads storage on boot and
 * `setPreference` writes it back. Theme is a device preference, not an account
 * setting, so it is not synced to the server and works for guests.
 */
export const useThemeStore = create<ThemeState>((set) => ({
  preference: "system",
  hydrated: false,

  setPreference: (preference) => {
    set({ preference });
    AsyncStorage.setItem(STORAGE_KEY, preference).catch(() => {});
  },

  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      set({ preference: isValidPreference(saved) ? saved : "system", hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
}));
