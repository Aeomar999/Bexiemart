import { tokens } from "@/theme/tokens";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as Application from "expo-application";
import * as Updates from "expo-updates";
import { useOTAUpdate } from "@/hooks/useOTAUpdate";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useCurrentUser } from "@/lib/hooks/use-auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAuthEnabled } from "@/lib/feature-flags";
import Toast from "@/lib/toast-polyfill";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeControl } from "@/components/ui/ThemeControl";
import { useDarkModeEnabled } from "@/lib/feature-flags";

type ProfileItem = {
  id: string;
  icon: string;
  label: string;
  route?: string;
  value?: string;
  requiresAuth?: boolean;
  comingSoon?: boolean;
  isUpdateCheck?: boolean;
  color?: string; // Add color property for distinct icon backgrounds
};

type ProfileSection = {
  title: string;
  items: ProfileItem[];
};

const PROFILE_SECTIONS: ProfileSection[] = [
  {
    title: "Account",
    items: [
      {
        id: "orders",
        icon: "shopping-bag",
        label: "Order History",
        route: "/(customer)/orders",
        requiresAuth: true,
        color: "#3b82f6", // blue
      },
      {
        id: "favorites",
        icon: "heart",
        label: "My Collections",
        route: "/(customer)/favorites",
        requiresAuth: true,
        color: "#ec4899", // pink
      },
      {
        id: "address",
        icon: "map-pin",
        label: "Delivery Addresses",
        route: "/(customer)/addresses",
        requiresAuth: true,
        color: "#f59e0b", // amber
      },
      {
        id: "payment",
        icon: "credit-card",
        label: "Payment Methods",
        route: "/(customer)/payment",
        requiresAuth: true,
        color: "#10b981", // green
      },
      {
        id: "drive",
        icon: "truck",
        label: "Drive for Bexiemart",
        route: "/(customer)/become-dispatcher",
        requiresAuth: true,
        color: "#6366f1", // indigo
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        id: "update",
        icon: "refresh-cw",
        label: "Check for Updates",
        isUpdateCheck: true,
        color: "#0ea5e9", // sky
      },
      {
        id: "notifications",
        icon: "bell",
        label: "Notifications",
        route: "/(customer)/notifications",
        requiresAuth: true,
        color: "#8b5cf6", // violet
      },
      {
        id: "dark_mode",
        icon: "moon",
        label: "Dark Mode",
        value: "Coming soon",
        comingSoon: true,
        color: "#334155",
      }, // slate
      {
        id: "language",
        icon: "globe",
        label: "Language",
        value: "Coming soon",
        comingSoon: true,
        color: "#14b8a6",
      }, // teal
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
        color: "#f97316",
      }, // orange
      {
        id: "contact",
        icon: "message-circle",
        label: "Contact Us",
        route: "/(customer)/contact",
        color: "#06b6d4",
      }, // cyan
    ],
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: user } = useCurrentUser();
  const { logout, isAuthenticated } = useAuthStore();
  const { authEnabled } = useAuthEnabled();
  const { darkModeEnabled } = useDarkModeEnabled();
  const { checkForUpdate, isChecking, isUpdateAvailable } = useOTAUpdate();

  const handleLogout = async () => {
    await logout();
    router.replace(authEnabled ? "/(auth)/login" : "/(customer)/(tabs)/(home)");
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-end justify-between"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View>
          <Text className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-[2px]">
            Customer
          </Text>
          <Text className="text-display-md font-heading font-black text-foreground">Profile</Text>
        </View>
        <Pressable
          className="w-[36px] h-[36px] rounded-full bg-background border border-border items-center justify-center"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <Icon name="settings" size={17} color={tokens.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10 pt-6 px-5"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-2xl mx-auto">
          {/* Identity card — sign-in CTA for guests, edit affordance for members */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isAuthenticated ? "Edit profile" : "Sign in or create an account"}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="bg-card rounded-2xl p-4 flex-row items-center border border-border mb-6"
            onPress={() =>
              router.push(isAuthenticated ? "/(customer)/edit-profile" : "/(auth)/login")
            }
          >
            <View className="mr-4">
              <Avatar
                uri={user?.image}
                name={user?.name || "Guest"}
                size={64}
                fallback={isAuthenticated ? "dicebear" : "icon"}
                iconName="user"
              />
            </View>
            <View className="flex-1 pr-2">
              <Text
                className="text-[20px] font-heading font-bold text-foreground"
                numberOfLines={1}
              >
                {isAuthenticated ? user?.name || "Bexiemart" : "Sign in or sign up"}
              </Text>
              <Text
                className="text-[13px] font-body text-muted-foreground mt-0.5"
                numberOfLines={1}
              >
                {isAuthenticated
                  ? user?.email || "Tap to edit your profile"
                  : "Access your orders, wallet & rewards"}
              </Text>
              {isAuthenticated && user?.phoneNumber && (
                <View className="flex-row items-center mt-1 gap-1.5">
                  <Text className="text-[13px] font-body text-muted-foreground" numberOfLines={1}>
                    {user.phoneNumber}
                  </Text>
                  {user.phoneNumberVerified ? (
                    <View className="bg-success/10 px-1.5 py-0.5 rounded">
                      <Text className="text-[10px] font-bold text-success uppercase">Verified</Text>
                    </View>
                  ) : (
                    <View className="bg-warning/10 px-1.5 py-0.5 rounded">
                      <Text className="text-[10px] font-bold text-warning uppercase">
                        Unverified
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            {isAuthenticated ? (
              <View className="w-10 h-10 rounded-full bg-background items-center justify-center border border-border">
                <Icon name="edit-2" size={16} color={tokens.textSecondary} />
              </View>
            ) : (
              <View className="rounded-full bg-primary px-4 py-2">
                <Text className="text-body-sm font-body font-bold text-white">Sign In</Text>
              </View>
            )}
          </Pressable>

          {/* Stat Cards (Wallet & Referrals) */}
          {isAuthenticated && (
            <View className="flex-row justify-between mb-8">
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="w-[48%] h-[60px] bg-card rounded-xl border border-border flex-row items-center px-4 gap-3"
                onPress={() => router.push("/(customer)/wallet")}
              >
                <View className="w-8 h-8 rounded-full bg-green-50 items-center justify-center">
                  <Icon name="banknote" size={16} color={tokens.success} />
                </View>
                <Text className="text-[14px] font-bold text-foreground font-heading">
                  My Wallet
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="w-[48%] h-[60px] bg-card rounded-xl border border-border flex-row items-center px-4 gap-3"
                onPress={() => router.push("/(customer)/referrals")}
              >
                <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                  <Icon name="gift" size={16} color={tokens.primary} />
                </View>
                <Text className="text-[14px] font-bold text-foreground font-heading">
                  Refer & Earn
                </Text>
              </Pressable>
            </View>
          )}

          {/* Sections */}
          {PROFILE_SECTIONS.map((section, idx) => {
            let items = section.items;

            return (
              <View key={idx} className="mb-8">
                <Text className="text-[12px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-3 px-2">
                  {section.title}
                </Text>
                <View className="bg-card rounded-2xl border border-border overflow-hidden">
                  {items.map((item, itemIdx) => {
                    const isLast = itemIdx === items.length - 1;

                    // Real Light/Dark/System control replaces the placeholder row
                    // when the dark-mode flag is enabled; otherwise the default
                    // "Coming soon" row renders below.
                    if (item.id === "dark_mode" && darkModeEnabled) {
                      return (
                        <View key={item.id} className={!isLast ? "border-b border-border" : ""}>
                          <ThemeControl />
                        </View>
                      );
                    }

                    const guestLocked = !!item.requiresAuth && !isAuthenticated;
                    return (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        accessibilityLabel={item.label}
                        accessibilityHint={
                          guestLocked
                            ? "Requires sign in"
                            : item.comingSoon
                              ? "Coming soon"
                              : undefined
                        }
                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                        className={`flex-row items-center justify-between h-[52px] px-4 ${!isLast ? "border-b border-border" : ""}`}
                        onPress={async () => {
                          if (item.isUpdateCheck) {
                            await checkForUpdate();
                            if (!isUpdateAvailable) {
                              Toast.show({
                                type: "success",
                                text1: "Up to date",
                                text2: "You are on the latest version of BexieMart.",
                              });
                            }
                            return;
                          }
                          if (item.comingSoon) {
                            Toast.show({
                              type: "info",
                              text1: "Coming soon",
                              text2: `${item.label} isn't available yet.`,
                            });
                            return;
                          }
                          if (guestLocked) {
                            router.push("/(auth)/login");
                            return;
                          }
                          if (item.route && item.route !== "#") {
                            router.push(item.route as any);
                          }
                        }}
                      >
                        <View className="flex-row items-center gap-3">
                          <View
                            className="w-8 h-8 rounded-xl items-center justify-center"
                            style={{ backgroundColor: `${item.color || tokens.primary}15` }}
                          >
                            <Icon name={item.icon} size={16} color={item.color || tokens.primary} />
                          </View>
                          <Text className="text-[15px] font-bold text-foreground">
                            {item.label}
                          </Text>
                        </View>

                        <View className="flex-row items-center gap-2">
                          {item.isUpdateCheck && isChecking && (
                            <ActivityIndicator
                              size="small"
                              color={tokens.primary}
                              style={{ marginRight: 4 }}
                            />
                          )}
                          {item.isUpdateCheck && !isChecking && (
                            <Text className="text-[12px] text-muted-foreground mr-1">
                              {Updates.updateId
                                ? Updates.updateId.substring(0, 7)
                                : Application.nativeApplicationVersion}
                            </Text>
                          )}
                          {item.value && !item.isUpdateCheck && (
                            <Text className="text-[12px] text-muted-foreground mr-1">
                              {item.value}
                            </Text>
                          )}
                          {guestLocked ? (
                            <Icon name="lock" size={16} color={tokens.textMuted} />
                          ) : (
                            <Icon name="chevron-right" size={16} color={tokens.textDisabled} />
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}

          {/* Auth action: sign out for members, sign in for guests */}
          {isAuthenticated ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Log out"
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className="flex-row items-center justify-center gap-2 p-4 bg-rose-50 rounded-xl mt-2 border border-rose-100"
              onPress={handleLogout}
            >
              <Icon name="log-out" size={18} color={tokens.error} />
              <Text className="text-body-lg font-body font-bold text-rose-500">Log Out</Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign in or create an account"
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className="flex-row items-center justify-center gap-2 p-4 bg-primary rounded-xl mt-2"
              onPress={() => router.push("/(auth)/login")}
            >
              <Icon name="log-in" size={18} color={tokens.primaryText} />
              <Text className="text-body-lg font-body font-bold text-white">
                Sign In / Create Account
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
