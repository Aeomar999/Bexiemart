import { tokens } from "@/theme/tokens";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
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
};

type ProfileSection = {
  title: string;
  items: ProfileItem[];
};

const PROFILE_SECTIONS: ProfileSection[] = [
  {
    title: "Rewards & Wallet",
    items: [
      {
        id: "wallet",
        icon: "banknote",
        label: "My Wallet",
        route: "/(customer)/wallet",
        requiresAuth: true,
      },
      {
        id: "referrals",
        icon: "gift",
        label: "Refer & Earn",
        route: "/(customer)/referrals",
        requiresAuth: true,
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
        requiresAuth: true,
      },
      {
        id: "favorites",
        icon: "heart",
        label: "My Collections",
        route: "/(customer)/favorites",
        requiresAuth: true,
      },
      {
        id: "address",
        icon: "map-pin",
        label: "Delivery Addresses",
        route: "/(customer)/addresses",
        requiresAuth: true,
      },
      {
        id: "payment",
        icon: "credit-card",
        label: "Payment Methods",
        route: "/(customer)/payment",
        requiresAuth: true,
      },
      {
        id: "drive",
        icon: "truck",
        label: "Drive for Bexiemart",
        route: "/(customer)/become-dispatcher",
        requiresAuth: true,
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
        requiresAuth: true,
      },
      { id: "dark_mode", icon: "moon", label: "Dark Mode", value: "Coming soon", comingSoon: true },
      { id: "language", icon: "globe", label: "Language", value: "Coming soon", comingSoon: true },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "help", icon: "help-circle", label: "Help Center", route: "/(customer)/help" },
      { id: "contact", icon: "message-circle", label: "Contact Us", route: "/(customer)/contact" },
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
        <Text className="text-display-sm font-heading font-black text-foreground">Profile</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10 pt-6 px-5"
        showsVerticalScrollIndicator={false}
      >
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
          <View className="flex-1">
            <Text
              className="text-display-sm font-heading font-bold text-foreground"
              numberOfLines={1}
            >
              {isAuthenticated ? user?.name || "Bexiemart" : "Sign in or sign up"}
            </Text>
            <Text className="text-body-sm font-body text-muted-foreground" numberOfLines={1}>
              {isAuthenticated
                ? user?.email || "Tap to edit your profile"
                : "Access your orders, wallet & rewards"}
            </Text>
          </View>
          {isAuthenticated ? (
            <View className="w-10 h-10 rounded-full bg-background items-center justify-center">
              <Icon name="edit-2" size={16} color={tokens.textSecondary} />
            </View>
          ) : (
            <View className="rounded-full bg-primary px-4 py-2">
              <Text className="text-body-sm font-body font-bold text-white">Sign In</Text>
            </View>
          )}
        </Pressable>

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
                value: isAuthenticated
                  ? user?.phoneNumber
                    ? user.phoneNumberVerified
                      ? `${user.phoneNumber} ✓`
                      : `${user.phoneNumber} (Unverified)`
                    : "Not set"
                  : undefined,
                route: "/(customer)/edit-phone",
                requiresAuth: true,
              },
              ...section.items,
            ];
          }

          return (
            <View key={idx} className="mb-6">
              <Text className="text-body-lg font-heading font-bold text-foreground mb-3 px-1">
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
                      className={`flex-row items-center justify-between p-4 ${!isLast ? "border-b border-border" : ""}`}
                      onPress={() => {
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
                          className="w-10 h-10 rounded-full items-center justify-center"
                          style={{ backgroundColor: `${tokens.primary}15` }}
                        >
                          <Icon name={item.icon} size={18} color={tokens.primary} />
                        </View>
                        <Text className="text-body-lg font-body font-semibold text-foreground">
                          {item.label}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-2">
                        {item.value && (
                          <Text className="text-body-sm font-body text-muted-foreground">
                            {item.value}
                          </Text>
                        )}
                        {guestLocked ? (
                          <Icon name="lock" size={16} color={tokens.textMuted} />
                        ) : (
                          <Icon name="chevron-right" size={18} color={tokens.textMuted} />
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
            <Icon name="log-in" size={18} color="#ffffff" />
            <Text className="text-body-lg font-body font-bold text-white">
              Sign In / Create Account
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
