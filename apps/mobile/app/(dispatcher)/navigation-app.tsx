import { tokens } from "@/theme/tokens";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "@/components/ui/BackButton";
import { Icon } from "@/components/ui/Icon";
import { getNavigationApps } from "@/lib/navigation-apps";
import { useNavigationApp } from "@/lib/stores/navigation-app-store";

export default function NavigationAppScreen() {
  const insets = useSafeAreaInsets();
  const selected = useNavigationApp((s) => s.app);
  const setApp = useNavigationApp((s) => s.setApp);
  const apps = getNavigationApps();

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center gap-3"
        style={{ paddingTop: Math.max(insets.top, 12) + 12 }}
      >
        <BackButton />
        <Text className="text-display-sm font-heading font-black text-foreground">
          Navigation app
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="pt-6 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <View
          accessibilityRole="radiogroup"
          className="bg-card rounded-[16px] border border-border overflow-hidden"
        >
          {apps.map((app, index) => {
            const isSelected = app.id === selected;
            return (
              <Pressable
                key={app.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                onPress={() => setApp(app.id)}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className={`flex-row items-center h-[52px] px-4 ${
                  index < apps.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <Text className="flex-1 text-[15px] font-bold text-foreground">{app.label}</Text>
                {isSelected && <Icon name="check" size={18} color={tokens.primary} />}
              </Pressable>
            );
          })}
        </View>
        <Text className="text-[13px] text-muted-foreground mt-3 px-2">
          Opens when you tap Navigate on an active delivery. If the app isn&apos;t installed,
          directions open in your browser.
        </Text>
      </ScrollView>
    </View>
  );
}
