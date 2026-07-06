import { View, Text, Pressable } from "react-native";
import { Icon } from "./Icon";
import { useThemeColors } from "@/theme/useThemeColors";
import { useThemeStore, type ThemePreference } from "@/lib/stores/theme-store";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Auto" },
];

/**
 * Light / Dark / System selector for the Profile settings list. A drop-in row
 * that replaces the placeholder "Dark Mode" item when the dark-mode flag is on.
 */
export function ThemeControl() {
  const c = useThemeColors();
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);

  return (
    <View className="flex-row items-center justify-between p-4">
      <View className="flex-row items-center gap-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: `${c.primary}15` }}
        >
          <Icon name="moon" size={18} color={c.primary} />
        </View>
        <Text className="text-body-lg font-body font-semibold text-foreground">Dark Mode</Text>
      </View>

      <View className="flex-row rounded-full bg-background p-1">
        {OPTIONS.map((option) => {
          const active = preference === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityLabel={`Theme: ${option.label}`}
              accessibilityState={{ selected: active }}
              onPress={() => setPreference(option.value)}
              className={`px-3 py-1.5 rounded-full ${active ? "bg-primary" : ""}`}
            >
              <Text
                className={`text-body-sm font-body font-semibold ${
                  active ? "text-white" : "text-muted-foreground"
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
