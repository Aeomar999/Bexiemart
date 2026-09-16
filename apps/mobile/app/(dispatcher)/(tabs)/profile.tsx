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
        {/* User Card */}
        <View className="bg-card rounded-2xl p-5 flex-row items-center border border-border mb-6">
          <View className="mr-4">
            <Avatar uri={user?.image} name={user?.name || "D"} size={64} fallback="initials" />
          </View>
          <View className="flex-1">
            <Text className="text-display-sm font-heading font-bold text-foreground">
              {user?.name || "Dispatcher"}
            </Text>
            <Text className="text-body-sm font-body text-muted-foreground">{user?.email}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-10 h-10 rounded-full bg-background items-center justify-center"
            onPress={() => router.push("/(dispatcher)/edit-profile")}
          >
            <Icon name="edit-2" size={16} color={tokens.textMuted} />
          </Pressable>
        </View>

        {/* Metrics Bar */}
        <View className="flex-row gap-3 mb-8">
          <View className="flex-1 bg-card border border-border p-3 rounded-2xl items-center">
            <View className="flex-row items-center gap-1 mb-1">
              <Icon name="truck" size={14} color={tokens.primary} />
              <Text className="font-bold text-foreground font-heading">
                {analytics?.trips30Days ?? 0}
              </Text>
            </View>
            <Text className="text-body-sm text-muted-foreground font-body text-center">
              30d Trips
            </Text>
          </View>
          <View className="flex-1 bg-card border border-border p-3 rounded-2xl items-center">
            <View className="flex-row items-center gap-1 mb-1">
              <Icon name="dollar-sign" size={14} color={tokens.success} />
              <Text className="font-bold text-foreground font-heading">
                {formatMoney(Number(analytics?.revenue30Days || 0), "GH₵")}
              </Text>
            </View>
            <Text className="text-body-sm text-muted-foreground font-body text-center">
              30d Revenue
            </Text>
          </View>
        </View>

        <View className="bg-card rounded-[20px] border border-border overflow-hidden mb-8">
          <View className="flex-row items-center h-[48px] px-4 border-b border-border">
            <Text className="text-[14px] font-bold text-foreground flex-1">Vehicle Type</Text>
            <Text className="text-[14px] font-bold text-muted-foreground">
              {formattedVehicleType}
            </Text>
          </View>
          <View className="flex-row items-center h-[48px] px-4 border-b border-border">
            <Text className="text-[14px] font-bold text-foreground flex-1">License Plate</Text>
            <Text className="text-[14px] font-bold text-muted-foreground">
              {profile?.plateNumber || "Not set"}
            </Text>
          </View>
          <Pressable className="flex-row items-center justify-between h-[48px] px-4 border-b border-border">
            <Text className="text-[14px] font-bold text-foreground flex-1">Navigation App</Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-[14px] font-bold text-muted-foreground">Google Maps</Text>
              <Icon name="chevron-right" size={16} color={tokens.textDisabled} />
            </View>
          </Pressable>
          <Pressable
            className="flex-row items-center justify-between h-[48px] px-4"
            onPress={() => router.push("/(dispatcher)/help")}
          >
            <Text className="text-[14px] font-bold text-foreground flex-1">Driver Support</Text>
            <Icon name="chevron-right" size={16} color={tokens.textDisabled} />
          </Pressable>
        </View>

        {/* Logout Button */}
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          className="flex-row items-center justify-center gap-2 h-[48px] bg-rose-50 rounded-[14px] mb-8 border border-rose-100"
          onPress={handleLogout}
        >
          <Icon name="log-out" size={16} color={tokens.error} />
          <Text className="text-[14px] font-bold text-rose-500 uppercase tracking-wider">
            Log Out
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
