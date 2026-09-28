import { tokens } from "@/theme/tokens";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAuthEnabled } from "@/lib/feature-flags";
import { Avatar } from "@/components/ui/Avatar";
import { UpdateCheckRow } from "@/components/ui/UpdateCheckRow";
import { useDispatcherProfile, useDispatcherAnalytics } from "@/lib/hooks/use-dispatcher";
import { useNavigationApp } from "@/lib/stores/navigation-app-store";
import { getNavigationAppLabel } from "@/lib/navigation-apps";
import { formatMoney } from "@/lib/money";

interface MenuRowProps {
  icon: string;
  tint: string;
  label: string;
  value?: string;
  onPress: () => void;
  last?: boolean;
}

function MenuRow({ icon, tint, label, value, onPress, last }: MenuRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      className={`flex-row items-center h-[52px] px-4 ${last ? "" : "border-b border-border"}`}
    >
      <View className="flex-row items-center gap-3 flex-1">
        <View
          className="w-8 h-8 rounded-xl items-center justify-center"
          style={{ backgroundColor: `${tint}15` }}
        >
          <Icon name={icon} size={16} color={tint} />
        </View>
        <Text className="text-[15px] font-bold text-foreground">{label}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        {value ? (
          <Text numberOfLines={1} className="text-[12px] text-muted-foreground">
            {value}
          </Text>
        ) : null}
        <Icon name="chevron-right" size={16} color={tokens.textDisabled} />
      </View>
    </Pressable>
  );
}

export default function DispatcherProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { authEnabled } = useAuthEnabled();
  const navigationApp = useNavigationApp((s) => s.app);

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
        className="px-5 pb-4 bg-card border-b border-border flex-row items-end justify-between"
        style={{ paddingTop: Math.max(insets.top, 12) + 12 }}
      >
        <View>
          <Text className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-[2px]">
            Rider
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
        className="flex-1 px-5"
        contentContainerClassName="pt-6 pb-32"
        showsVerticalScrollIndicator={false}
      >
        {/* Identity & 30-day stats */}
        <View className="bg-card rounded-[20px] border border-border mb-8 overflow-hidden">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            accessibilityHint="Change your name, photo and location"
            onPress={() => router.push("/(dispatcher)/edit-profile")}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="p-5 flex-row items-center"
          >
            <View className="mr-4">
              <Avatar uri={user?.image} name={user?.name || "D"} size={56} fallback="initials" />
            </View>
            <View className="flex-1 mr-3">
              <Text
                numberOfLines={1}
                className="text-[20px] font-heading font-bold text-foreground"
              >
                {user?.name || "Dispatcher"}
              </Text>
              <Text numberOfLines={1} className="text-[13px] text-muted-foreground mt-[2px]">
                {user?.email}
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color={tokens.textDisabled} />
          </Pressable>

          <View className="bg-muted border-t border-border px-5 pt-3 pb-4">
            <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.08em] mb-2">
              Last 30 days
            </Text>
            <View className="flex-row">
              <View className="flex-1">
                <Text className="text-[13px] text-muted-foreground mb-[2px]">Trips</Text>
                <Text className="text-[20px] font-heading font-black text-foreground">
                  {analytics?.trips30Days ?? 0}
                </Text>
              </View>
              <View className="w-px bg-border mx-4" />
              <View className="flex-1">
                <Text className="text-[13px] text-muted-foreground mb-[2px]">Earnings</Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  className="text-[20px] font-heading font-black text-foreground"
                >
                  {formatMoney(Number(analytics?.revenue30Days || 0), "GH₵")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-[12px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3 px-2">
            Vehicle
          </Text>
          <View className="bg-card rounded-[16px] border border-border overflow-hidden">
            <MenuRow
              icon="truck"
              tint="#6366f1"
              label="Type"
              value={formattedVehicleType}
              onPress={() => router.push("/(dispatcher)/vehicle")}
            />
            <MenuRow
              icon="hash"
              tint="#f59e0b"
              label="Licence plate"
              value={profile?.plateNumber || "Not set"}
              onPress={() =>
                router.push({ pathname: "/(dispatcher)/vehicle", params: { field: "plate" } })
              }
              last
            />
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-[12px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3 px-2">
            Preferences
          </Text>
          <View className="bg-card rounded-[16px] border border-border overflow-hidden">
            <MenuRow
              icon="navigation"
              tint="#3b82f6"
              label="Navigation app"
              value={getNavigationAppLabel(navigationApp)}
              onPress={() => router.push("/(dispatcher)/navigation-app")}
            />
            <MenuRow
              icon="life-buoy"
              tint="#f97316"
              label="Driver support"
              onPress={() => router.push("/(dispatcher)/help")}
            />
            <UpdateCheckRow last />
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
