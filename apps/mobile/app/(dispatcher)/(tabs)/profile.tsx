import { View, Text, ScrollView, Pressable, Switch } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAuthEnabled } from "@/lib/feature-flags";
import { Avatar } from "@/components/ui/Avatar";

export default function DispatcherProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { authEnabled } = useAuthEnabled();
  const [autoAccept, setAutoAccept] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace(authEnabled ? "/(auth)/login" : "/(customer)/(tabs)/(home)");
  };

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
              <Icon name="star" size={14} color="#f59e0b" />
              <Text className="font-bold text-foreground font-heading">4.9</Text>
            </View>
            <Text className="text-body-sm text-muted-foreground font-body text-center">Rating</Text>
          </View>
          <View className="flex-1 bg-card border border-border p-3 rounded-2xl items-center">
            <View className="flex-row items-center gap-1 mb-1">
              <Icon name="check-circle" size={14} color="#10b981" />
              <Text className="font-bold text-foreground font-heading">98%</Text>
            </View>
            <Text className="text-body-sm text-muted-foreground font-body text-center">
              Acceptance
            </Text>
          </View>
          <View className="flex-1 bg-card border border-border p-3 rounded-2xl items-center">
            <View className="flex-row items-center gap-1 mb-1">
              <Icon name="truck" size={14} color="var(--color-primary)" />
              <Text className="font-bold text-foreground font-heading">142</Text>
            </View>
            <Text className="text-body-sm text-muted-foreground font-body text-center">
              Total Trips
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
              <Text className="text-body-sm font-body text-muted-foreground">Motorbike</Text>
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
              <Text className="text-body-sm font-body text-muted-foreground">AS-1234-21</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <Text className="text-body-lg font-heading font-bold text-foreground mb-3 px-1">
          Preferences
        </Text>
        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-8 shadow-lg">
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-primary-subtle items-center justify-center">
                <Icon name="zap" size={18} color="var(--color-primary)" />
              </View>
              <View>
                <Text className="text-body-lg font-body font-semibold text-foreground">
                  Auto-Accept Trips
                </Text>
                <Text className="text-body-sm font-body text-muted-foreground mt-0.5">
                  Automatically accept nearby requests
                </Text>
              </View>
            </View>
            <Switch
              value={autoAccept}
              onValueChange={setAutoAccept}
              trackColor={{ false: "#e2e8f0", true: "var(--color-primary)" }}
              thumbColor={"#ffffff"}
            />
          </View>
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
          <Pressable className="flex-row items-center justify-between p-4">
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
