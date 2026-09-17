import { tokens } from "@/theme/tokens";
import { View, Text, ScrollView, Switch, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAuthEnabled } from "@/lib/feature-flags";
import { Avatar } from "@/components/ui/Avatar";

const SETTINGS_SECTIONS = [
  {
    title: "Store",
    items: [
      {
        id: "profile",
        icon: "store",
        label: "Store Profile",
        route: "/(vendor)/(settings)/profile",
        color: tokens.primary,
      },
      {
        id: "hours",
        icon: "clock",
        label: "Operating Hours",
        value: "08:00 - 21:00",
        route: "/(vendor)/(settings)/hours",
        color: tokens.primary,
      },
      {
        id: "staff",
        icon: "users",
        label: "Staff Management",
        route: "/(vendor)/(settings)/staff",
        color: tokens.primary,
      },
    ],
  },
  {
    title: "Marketing",
    items: [
      {
        id: "promotions",
        icon: "tag",
        label: "Promotions",
        value: "2 live",
        route: "/(vendor)/(settings)/promotions",
        color: tokens.primary,
      },
      {
        id: "reviews",
        icon: "star",
        label: "Customer reviews",
        value: "4.8 • 62",
        route: "/(vendor)/(settings)/reviews",
        color: tokens.primary,
      },
    ],
  },
  {
    title: "Money",
    items: [
      {
        id: "payment",
        icon: "credit-card",
        label: "Payout method",
        value: "MTN •••• 4821",
        route: "/(vendor)/(settings)/payment",
        color: tokens.primary,
      },
      {
        id: "taxes",
        icon: "file-text",
        label: "Taxes & documents",
        route: "/(vendor)/(settings)/taxes",
        color: tokens.primary,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        id: "notifications",
        icon: "bell",
        label: "Notifications",
        route: "/(vendor)/(settings)/notification-settings",
        color: tokens.primary,
      },
      { id: "dark_mode", icon: "moon", label: "Dark Mode", type: "toggle", color: tokens.primary },
      {
        id: "security",
        icon: "shield",
        label: "Security",
        route: "/(vendor)/(settings)/security",
        color: tokens.primary,
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        id: "help",
        icon: "help-circle",
        label: "Help Center",
        route: "/(vendor)/(settings)/help",
        color: tokens.primary,
      },
      {
        id: "contact",
        icon: "message-circle",
        label: "Contact Us",
        route: "/(vendor)/(settings)/contact",
        color: tokens.primary,
      },
    ],
  },
];

export default function VendorSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, logout } = useAuthStore();
  const { authEnabled } = useAuthEnabled();

  const handleLogout = async () => {
    await logout();
    router.replace(authEnabled ? "/(auth)/login" : "/(customer)/(tabs)/(home)");
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <Text className="text-display-md font-heading font-black text-foreground">Settings</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10 pt-6 px-5"
        showsVerticalScrollIndicator={false}
      >
        {/* Vendor Profile Card */}
        <View className="bg-card rounded-2xl p-5 flex-row items-center border border-border mb-8">
          <View className="mr-4">
            <Avatar uri={user?.image} name={user?.name || "V"} size={64} fallback="initials" />
          </View>
          <View className="flex-1">
            <Text className="text-display-sm font-heading font-bold text-foreground">
              {user?.name || "My Store"}
            </Text>
            <Text className="text-body-sm font-body text-muted-foreground">
              {user?.email || "Vendor Account"}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="w-10 h-10 rounded-full bg-background items-center justify-center"
            onPress={() => router.push("/(vendor)/(settings)/profile")}
          >
            <Icon name="edit-2" size={16} color={tokens.textMuted} />
          </Pressable>
        </View>

        {/* Sections */}
        <View className="gap-6 mb-6">
          {SETTINGS_SECTIONS.map((section, idx) => (
            <View key={idx}>
              <Text className="text-[12px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">
                {section.title}
              </Text>
              <View className="bg-card rounded-2xl border border-border overflow-hidden">
                {section.items.map((item, itemIdx) => {
                  const isLast = itemIdx === section.items.length - 1;
                  return (
                    <Pressable
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      key={item.id}
                      className={`flex-row items-center justify-between h-[52px] px-4 ${!isLast ? "border-b border-border" : ""}`}
                      disabled={(item as any).type === "toggle"}
                      onPress={() => {
                        if (item.route && item.route !== "#") {
                          router.push(item.route as any);
                        }
                      }}
                    >
                      <View className="flex-row items-center gap-3">
                        <View
                          className="w-8 h-8 rounded-xl items-center justify-center"
                          style={{ backgroundColor: `${item.color}15` }}
                        >
                          <Icon name={item.icon} size={16} color={item.color} />
                        </View>
                        <Text className="text-[15px] font-bold text-foreground">{item.label}</Text>
                      </View>

                      <View className="flex-row items-center gap-2">
                        {(item as any).value && (
                          <Text className="text-[12px] text-muted-foreground mr-1">
                            {(item as any).value}
                          </Text>
                        )}
                        {(item as any).type === "toggle" ? (
                          <Switch
                            value={isDarkMode}
                            onValueChange={setIsDarkMode}
                            trackColor={{ false: "#e2e8f0", true: tokens.primary }}
                            thumbColor={tokens.primaryText}
                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                          />
                        ) : (
                          <Icon name="chevron-right" size={16} color={tokens.textDisabled} />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Logout Button */}
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          className="flex-row items-center justify-center gap-2 h-[48px] bg-rose-50 rounded-[14px] mb-8 border border-rose-100"
          onPress={handleLogout}
        >
          <Icon name="log-out" size={17} color={tokens.error} />
          <Text className="text-[15px] font-bold text-rose-500">Log out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
