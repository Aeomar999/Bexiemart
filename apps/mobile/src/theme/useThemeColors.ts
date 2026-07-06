import { useColorScheme } from "nativewind";
import { getThemeColors, type ThemeColors } from "./tokens";

/**
 * Returns the resolved color palette for the active theme, reactive to scheme
 * changes. Use for JS-prop colors (icon `color=`, `style={{ backgroundColor }}`,
 * `ActivityIndicator`, gradients) that CSS variables cannot reach.
 *
 * Usage: `const c = useThemeColors(); <Icon color={c.primary} />`
 */
export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return getThemeColors(colorScheme === "dark" ? "dark" : "light");
}
