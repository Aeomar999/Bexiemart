import { View, Text, ScrollView, Switch, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Avatar } from "@/components/ui/Avatar";

const SETTINGS_SECTIONS = [
  {
    title: "Store Management",
    items: [
      {
        id: "profile",
        icon: "store",
        label: "Store Profile",
        route: "/(vendor)/(settings)/profile",
        color: "#004CFF",
      },
      {
        id: "hours",
        icon: "clock",
        label: "Operating Hours",
        route: "/(vendor)/(settings)/hours",
        color: "#f59e0b",
      },
      {
        id: "staff",
        icon: "users",
        label: "Staff Management",
        route: "/(vendor)/(settings)/staff",
        color: "#10b981",
      },
    ],
  },
  {
    title: "Marketing & Feedback",
    items: [
      {
        id: "promotions",
        icon: "tag",
        label: "Promotions & Discounts",
        route: "/(vendor)/(settings)/promotions",
        color: "#ec4899",
      },
      {
        id: "reviews",
        icon: "star",
        label: "Customer Reviews",
        route: "/(vendor)/(settings)/reviews",
        color: "#f59e0b",
      },
    ],
  },
  {
    title: "Financials",
    items: [
      {
        id: "payment",
        icon: "credit-card",
        label: "Payment Methods",
        route: "/(vendor)/(settings)/payment",
        color: "#7c3aed",
      },
      {
        id: "taxes",
        icon: "file-text",
        label: "Taxes & Documents",
        route: "/(vendor)/(settings)/taxes",
        color: "#ec4899",
      },
    ],
  },
  {
    title: "Account & Preferences",
    items: [
      {
        id: "notifications",
        icon: "bell",
        label: "Notifications",
        route: "/(vendor)/(settings)/notification-settings",
        color: "#f59e0b",
      },
      { id: "dark_mode", icon: "moon", label: "Dark Mode", type: "toggle", color: "#1e293b" },
      {
        id: "security",
        icon: "shield",
        label: "Security",
        route: "/(vendor)/(settings)/security",
        color: "#059669",
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
        color: "#3b82f6",
      },
      {
        id: "contact",
        icon: "message-circle",
        label: "Contact Us",
        route: "/(vendor)/(settings)/contact",
        color: "#10b981",
      },
    ],
  },
];

export default function VendorSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <Text className="text-[28px] font-heading font-black text-foreground">Settings</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10 pt-6 px-5"
        showsVerticalScrollIndicator={false}
      >
        {/* Vendor Profile Card */}
        <View className="bg-card rounded-[24px] p-5 flex-row items-center shadow-[0_10px_20px_rgba(0,0,0,0.03)] border border-border mb-8">
          <View className="mr-4">
            <Avatar uri={user?.image} name={user?.name || "V"} size={64} fallback="initials" />
          </View>
          <View className="flex-1">
            <Text className="text-[20px] font-heading font-bold text-foreground">
              {user?.name || "My Store"}
            </Text>
            <Text className="text-body-sm font-body text-muted-foreground">
              {user?.email || "Vendor Account"}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="w-10 h-10 rounded-full bg-background items-center justify-center"
            onPress={() => router.push("/(vendor)/(settings)/profile")}
          >
            <Icon name="edit-2" size={16} color="#64748b" />
          </Pressable>
        </View>

        {/* Sections */}
        {SETTINGS_SECTIONS.map((section, idx) => (
          <View key={idx} className="mb-8">
            <Text className="text-[16px] font-heading font-bold text-foreground mb-3 px-1">
              {section.title}
            </Text>
            <View className="bg-card rounded-[24px] border border-border overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.02)]">
              {section.items.map((item, itemIdx) => {
                const isLast = itemIdx === section.items.length - 1;
                return (
                  <Pressable
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    key={item.id}
                    className={`flex-row items-center justify-between p-4 ${!isLast ? "border-b border-border" : ""}`}
                    disabled={item.type === "toggle"}
                    onPress={() => {
                      if (item.route && item.route !== "#") {
                        router.push(item.route as any);
                      }
                    }}
                  >
                    <View className="flex-row items-center gap-3">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: `${item.color}15` }}
                      >
                        <Icon name={item.icon} size={18} color={item.color} />
                      </View>
                      <Text className="text-[15px] font-body font-semibold text-foreground">
                        {item.label}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                      {item.type === "toggle" ? (
                        <Switch
                          value={isDarkMode}
                          onValueChange={setIsDarkMode}
                          trackColor={{ false: "#e2e8f0", true: "#004CFF" }}
                          thumbColor={"#ffffff"}
                        />
                      ) : (
                        <Icon name="chevron-right" size={18} color="#cbd5e1" />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          className="flex-row items-center justify-center gap-2 p-4 bg-rose-50 rounded-[16px] mt-2 border border-rose-100 active:opacity-70"
          onPress={handleLogout}
        >
          <Icon name="log-out" size={18} color="#ef4444" />
          <Text className="text-[15px] font-body font-bold text-rose-500">Log Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
