import { useEffect } from "react";
import { Appearance } from "react-native";
import { colorScheme } from "nativewind";
import { useThemeStore, resolveScheme } from "@/lib/stores/theme-store";

/**
 * Headless controller that keeps NativeWind's active color scheme in sync with
 * the persisted theme preference. Mounted once at the root layout.
 *
 * - Hydrates the saved preference on boot.
 * - Applies the resolved scheme to NativeWind (which activates the `.dark` CSS
 *   variable block in `global.css`).
 * - While in `system` mode, follows live OS appearance changes.
 *
 * Renders nothing.
 */
export function ThemeController(): null {
  const preference = useThemeStore((s) => s.preference);
  const hydrate = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const apply = () => colorScheme.set(resolveScheme(preference, Appearance.getColorScheme()));
    apply();

    // Only react to OS changes when the user is following the system.
    const subscription = Appearance.addChangeListener(() => {
      if (useThemeStore.getState().preference === "system") apply();
    });
    return () => subscription.remove();
  }, [preference]);

  return null;
}
