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
        <View className="bg-card rounded-2xl p-5 flex-row items-center shadow-lg border border-border mb-6">
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
            <Icon name="edit-2" size={16} color="#64748b" />
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
              <Icon name="dollar-sign" size={14} color="#10b981" />
              <Text className="font-bold text-foreground font-heading">
                {formatMoney(Number(analytics?.revenue30Days || 0), "GH₵")}
              </Text>
            </View>
            <Text className="text-body-sm text-muted-foreground font-body text-center">
              30d Revenue
            </Text>
          </View>
        </View>

        {/* Vehicle Details */}
        <Text className="text-body-lg font-heading font-bold text-foreground mb-3 px-1">
          Vehicle Details
        </Text>
        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-8 shadow-lg">
          <View className="flex-row items-center p-4 border-b border-border">
            <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-3">
              <Icon name="truck" size={18} color="#64748b" />
            </View>
            <View className="flex-1">
              <Text className="text-body-lg font-body font-semibold text-foreground">Type</Text>
              <Text className="text-body-sm font-body text-muted-foreground">
                {formattedVehicleType}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center p-4 border-b border-border">
            <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-3">
              <Icon name="credit-card" size={18} color="#64748b" />
            </View>
            <View className="flex-1">
              <Text className="text-body-lg font-body font-semibold text-foreground">
                License Plate
              </Text>
              <Text className="text-body-sm font-body text-muted-foreground">
                {profile?.plateNumber || "Not set"}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <Text className="text-body-lg font-heading font-bold text-foreground mb-3 px-1">
          Preferences
        </Text>
        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-8 shadow-lg">
          <Pressable className="flex-row items-center justify-between p-4 border-b border-border">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center">
                <Icon name="navigation" size={18} color="#10b981" />
              </View>
              <Text className="text-body-lg font-body font-semibold text-foreground">
                Navigation App
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-body-sm font-body text-muted-foreground">Google Maps</Text>
              <Icon name="chevron-right" size={18} color="#cbd5e1" />
            </View>
          </Pressable>
          <Pressable
            className="flex-row items-center justify-between p-4"
            onPress={() => router.push("/(dispatcher)/help")}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-rose-50 items-center justify-center">
                <Icon name="help-circle" size={18} color="#e11d48" />
              </View>
              <Text className="text-body-lg font-body font-semibold text-foreground">
                Driver Support
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color="#cbd5e1" />
          </Pressable>
        </View>

        {/* Logout Button */}
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          className="flex-row items-center justify-center gap-2 p-4 bg-rose-50 rounded-xl mb-8 border border-rose-100"
          onPress={handleLogout}
        >
          <Icon name="log-out" size={18} color="#ef4444" />
          <Text className="text-body-lg font-body font-bold text-rose-500">Log Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
