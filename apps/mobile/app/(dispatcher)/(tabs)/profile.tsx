import { tokens } from "@/theme/tokens";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAuthEnabled } from "@/lib/feature-flags";
import { Avatar } from "@/components/ui/Avatar";
import { useDispatcherProfile, useDispatcherAnalytics } from "@/lib/hooks/use-dispatcher";
import { formatMoney } from "@/lib/money";

export default function DispatcherProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { authEnabled } = useAuthEnabled();

  const { data: profile } = useDispatcherProfile();
  const { data: analytics } = useDispatcherAnalytics();

  const handleLogout = async () => {
    await logout();
    router.replace(authEnabled ? "/(auth)/login" : "/(customer)/(tabs)/(home)");
  };

  const formattedVehicleType = profile?.vehicleType
    ? profile.vehicleType.charAt(0).toUpperCase() + profile.vehicleType.slice(1).toLowerCase()
    : "Not set";

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border"
        style={{ paddingTop: Math.max(insets.top, 12) + 12 }}
      >
        <Text className="text-display-sm font-heading font-black text-foreground">My Profile</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-10" showsVerticalScrollIndicator={false}>
        {/* User Identity & Metrics Card */}
        <View className="bg-card rounded-[20px] border border-border mb-8 overflow-hidden">
          <View className="p-5 flex-row items-center">
            <View className="mr-4">
              <Avatar uri={user?.image} name={user?.name || "D"} size={64} fallback="initials" />
            </View>
            <View className="flex-1">
              <Text className="text-[20px] font-heading font-bold text-foreground">
                {user?.name || "Dispatcher"}
              </Text>
              <Text className="text-[13px] text-muted-foreground mt-[2px]">{user?.email}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-10 h-10 rounded-full bg-background items-center justify-center border border-border"
              onPress={() => router.push("/(dispatcher)/edit-profile")}
            >
              <Icon name="edit-2" size={16} color={tokens.textMuted} />
            </Pressable>
          </View>

          <View className="flex-row items-center bg-[#f8fafc] border-t border-border px-5 py-[14px]">
            <View className="flex-1">
              <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.08em] mb-[2px]">
                Trips
              </Text>
              <Text className="text-[20px] font-heading font-black text-foreground">
                {analytics?.trips30Days ?? 0}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.08em] mb-[2px]">
                Revenue
              </Text>
              <Text className="text-[20px] font-heading font-black text-foreground">
                {formatMoney(Number(analytics?.revenue30Days || 0), "GH₵")}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.08em] mb-[2px]">
                Rating
              </Text>
              <Text className="text-[20px] font-heading font-black text-foreground">4.9</Text>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-[12px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">
            Vehicle
          </Text>
          <View className="bg-card rounded-[16px] border border-border overflow-hidden">
            <View className="flex-row items-center h-[52px] px-4 border-b border-border">
              <View className="flex-row items-center gap-3 flex-1">
                <View
                  className="w-8 h-8 rounded-xl items-center justify-center"
                  style={{ backgroundColor: `${tokens.primary}15` }}
                >
                  <Icon name="truck" size={16} color={tokens.primary} />
                </View>
                <Text className="text-[15px] font-bold text-foreground">Type</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-[12px] text-muted-foreground">{formattedVehicleType}</Text>
                <Icon name="chevron-right" size={16} color={tokens.textDisabled} />
              </View>
            </View>
            <View className="flex-row items-center h-[52px] px-4">
              <View className="flex-row items-center gap-3 flex-1">
                <View
                  className="w-8 h-8 rounded-xl items-center justify-center"
                  style={{ backgroundColor: `${tokens.primary}15` }}
                >
                  <Icon name="hash" size={16} color={tokens.primary} />
                </View>
                <Text className="text-[15px] font-bold text-foreground">Licence plate</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-[12px] text-muted-foreground">
                  {profile?.plateNumber || "Not set"}
                </Text>
                <Icon name="chevron-right" size={16} color={tokens.textDisabled} />
              </View>
            </View>
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-[12px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">
            Preferences
          </Text>
          <View className="bg-card rounded-[16px] border border-border overflow-hidden">
            <Pressable className="flex-row items-center h-[52px] px-4 border-b border-border">
              <View className="flex-row items-center gap-3 flex-1">
                <View
                  className="w-8 h-8 rounded-xl items-center justify-center"
                  style={{ backgroundColor: `${tokens.primary}15` }}
                >
                  <Icon name="navigation" size={16} color={tokens.primary} />
                </View>
                <Text className="text-[15px] font-bold text-foreground">Navigation app</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-[12px] text-muted-foreground">Google Maps</Text>
                <Icon name="chevron-right" size={16} color={tokens.textDisabled} />
              </View>
            </Pressable>
            <Pressable
              className="flex-row items-center h-[52px] px-4"
              onPress={() => router.push("/(dispatcher)/help")}
            >
              <View className="flex-row items-center gap-3 flex-1">
                <View
                  className="w-8 h-8 rounded-xl items-center justify-center"
                  style={{ backgroundColor: `${tokens.primary}15` }}
                >
                  <Icon name="life-buoy" size={16} color={tokens.primary} />
                </View>
                <Text className="text-[15px] font-bold text-foreground">Driver support</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Icon name="chevron-right" size={16} color={tokens.textDisabled} />
              </View>
            </Pressable>
          </View>
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
