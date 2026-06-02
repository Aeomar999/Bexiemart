import { View, Text, ScrollView, Switch, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useState } from "react";
import { useCurrentUser } from "@/lib/hooks/use-auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import Toast from "@/lib/toast-polyfill";
import { Image } from "expo-image";

const PROFILE_SECTIONS = [
  {
    title: "Rewards & Wallet",
    items: [
      {
        id: "wallet",
        icon: "credit-card",
        label: "My Wallet",
        route: "/(customer)/wallet",
        color: "#f59e0b",
      },
      {
        id: "referrals",
        icon: "gift",
        label: "Refer & Earn",
        route: "/(customer)/referrals",
        color: "#ec4899",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        id: "orders",
        icon: "shopping-bag",
        label: "Order History",
        route: "/(customer)/orders",
        color: "#004CFF",
      },
      {
        id: "favorites",
        icon: "heart",
        label: "My Collections",
        route: "/(customer)/favorites",
        color: "#ef4444",
      },
      {
        id: "address",
        icon: "map-pin",
        label: "Delivery Addresses",
        route: "/(customer)/addresses",
        color: "#059669",
      },
      {
        id: "payment",
        icon: "credit-card",
        label: "Payment Methods",
        route: "/(customer)/payment",
        color: "#7c3aed",
      },
      {
        id: "drive",
        icon: "truck",
        label: "Drive for Bexiemart",
        route: "/(customer)/become-dispatcher",
        color: "#f97316",
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        id: "notifications",
        icon: "bell",
        label: "Notifications",
        route: "/(customer)/notifications",
        color: "#f59e0b",
      },
      { id: "dark_mode", icon: "moon", label: "Dark Mode", type: "toggle", color: "#1e293b" },
      {
        id: "language",
        icon: "globe",
        label: "Language",
        value: "English",
        route: "/(customer)/settings/language",
        color: "#0ea5e9",
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
        route: "/(customer)/help",
        color: "#3b82f6",
      },
      {
        id: "contact",
        icon: "message-circle",
        label: "Contact Us",
        route: "/(customer)/contact",
        color: "#10b981",
      },
    ],
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { data: user } = useCurrentUser();
  const { logout } = useAuthStore();

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
        <Text className="text-[20px] font-heading font-black text-foreground">Profile</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10 pt-6 px-5"
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View className="bg-card rounded-[24px] p-5 flex-row items-center shadow-[0_10px_20px_rgba(0,0,0,0.03)] border border-border mb-8">
          <View className="w-[64px] h-[64px] rounded-full bg-brand-100 items-center justify-center border-4 border-card shadow-sm mr-4 overflow-hidden">
            <Image
              source={{
                uri:
                  user?.image ||
                  `https://api.dicebear.com/9.x/micah/png?seed=${encodeURIComponent(user?.name || "Bexiemart")}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
              }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </View>
          <View className="flex-1">
            <Text className="text-[20px] font-heading font-bold text-foreground">
              {user?.name || "Guest"}
            </Text>
            <Text className="text-body-sm font-body text-muted-foreground">
              {user?.email || "Login to access full features"}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="w-10 h-10 rounded-full bg-background items-center justify-center"
            onPress={() => router.push("/(customer)/edit-profile")}
          >
            <Icon name="edit-2" size={16} color="#64748b" />
          </Pressable>
        </View>

        {/* Sections */}
        {PROFILE_SECTIONS.map((section, idx) => {
          let items = section.items;
          // Inject phone number into the Account section dynamically
          if (section.title === "Account") {
            items = [
              {
                id: "phone",
                icon: "smartphone",
                label: "Phone Number",
                value: user?.phoneNumber
                  ? user.phoneNumberVerified
                    ? `${user.phoneNumber} ✓`
                    : `${user.phoneNumber} (Unverified)`
                  : "Not set",
                route: "/(customer)/edit-phone",
                color: "#10b981",
              },
              ...section.items,
            ];
          }

          return (
            <View key={idx} className="mb-8">
              <Text className="text-[16px] font-heading font-bold text-foreground mb-3 px-1">
                {section.title}
              </Text>
              <View className="bg-card rounded-[24px] border border-border overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.02)]">
                {items.map((item, itemIdx) => {
                  const isLast = itemIdx === items.length - 1;
                  return (
                    <Pressable
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      key={item.id}
                      className={`flex-row items-center justify-between p-4 ${!isLast ? "border-b border-border" : ""}`}
                      disabled={item.type === "toggle"}
                      onPress={() => {
                        if (item.route && item.route !== "#") {
                          if (item.route.includes("language")) {
                            Toast.show({
                              type: "info",
                              text1: "Coming Soon",
                              text2: "Language settings are not available yet.",
                            });
                          } else {
                            router.push(item.route as any);
                          }
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
                        {item.value && (
                          <Text className="text-body-sm font-body text-muted-foreground">
                            {item.value}
                          </Text>
                        )}
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
          );
        })}

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
