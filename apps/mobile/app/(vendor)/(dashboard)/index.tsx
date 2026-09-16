import { tokens } from "@/theme/tokens";
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { OrderCard, OrderItem } from "@/components/ui/OrderCard";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useVendorStats, useVendorOrders, useVendorEarnings } from "@/lib/hooks/use-vendor";

const STAT_ITEMS = [
  {
    key: "totalProducts",
    label: "Total Products",
    icon: "package",
    color: "#3b82f6",
    bg: "#eff6ff",
  },
  {
    key: "totalOrders",
    label: "Total Orders",
    icon: "shopping-bag",
    color: "#10b981",
    bg: "#d1fae5",
  },
  { key: "pendingOrders", label: "Pending", icon: "clock", color: "#f59e0b", bg: "#fef3c7" },
  { key: "totalCustomers", label: "Customers", icon: "users", color: "#8b5cf6", bg: "#f3e8ff" },
];

const QUICK_ACTIONS = [
  {
    id: "1",
    label: "Add\nProduct",
    icon: "plus",
    color: "#10b981",
    bg: "#ecfdf5",
    route: "/(vendor)/(products)",
  },
  {
    id: "2",
    label: "Withdraw\nFunds",
    icon: "dollar-sign",
    color: tokens.primary,
    bg: "#e0e7ff",
    route: "/(vendor)/(earnings)",
  },
  {
    id: "5",
    label: "Create\nReel",
    icon: "video",
    color: "#8b5cf6",
    bg: "#f3e8ff",
    route: "/(vendor)/add-reel",
  },
  {
    id: "4",
    label: "Store\nSettings",
    icon: "settings",
    color: tokens.textMuted,
    bg: "#f1f5f9",
    route: "/(vendor)/(settings)",
  },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useVendorStats();
  const { data: ordersData, refetch: refetchOrders } = useVendorOrders();
  const { data: earningsData, refetch: refetchEarnings } = useVendorEarnings();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchOrders(), refetchEarnings()]);
    setRefreshing(false);
  }, []);

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pb-4 bg-card border-b border-border"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-0.5">
              {user?.name?.split(" ")[0] || "Store Name"} • Active
            </Text>
            <Text className="text-display-sm font-heading font-black text-foreground">
              Dashboard
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Messages"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className="w-10 h-10 rounded-full bg-background border border-border items-center justify-center relative"
              onPress={() => router.push("/(vendor)/inbox")}
            >
              <Icon name="message-square" size={20} color={tokens.textMuted} />
              <View className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-card" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className="w-10 h-10 rounded-full bg-background border border-border items-center justify-center relative"
              onPress={() => router.push("/(vendor)/notifications")}
            >
              <Icon name="bell" size={20} color={tokens.textMuted} />
              <View className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border border-card" />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10 pt-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.primary}
          />
        }
      >
        {/* ===== HERO / EARNINGS ===== */}
        <View className="px-5 mb-8">
          <View className="rounded-[20px] p-6 shadow-elevation-2 overflow-hidden border border-black/5">
            <LinearGradient
              colors={tokens.moneyGrad1 as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <Text className="text-white/80 font-body text-[14px] mb-2 font-medium">
              Available Balance
            </Text>
            <Text className="text-[36px] font-heading font-black text-white tracking-tight">
              GHS {earningsData?.availableBalance?.toFixed(2) ?? "0.00"}
            </Text>
          </View>
        </View>

        {/* ===== QUICK ACTIONS ===== */}
        <View className="px-5 mb-8 flex-row justify-between">
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => action.route !== "#" && router.push(action.route as any)}
              style={{ alignItems: "center", width: "22%" }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                  backgroundColor: action.bg,
                }}
              >
                <Icon name={action.icon} size={24} color={action.color} />
              </View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: tokens.textPrimary,
                  textAlign: "center",
                  lineHeight: 12,
                }}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ===== STAT CARDS ===== */}
        <View className="px-5 mb-8">
          <Text className="text-heading-md font-heading font-bold text-foreground mb-4">
            Store Performance
          </Text>
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {statsLoading ? (
              <View className="w-full items-center py-8">
                <ActivityIndicator size="small" color={tokens.primary} />
              </View>
            ) : statsError ? (
              <View className="w-full items-center py-8">
                <Text className="text-body-sm text-red-500">Failed to load stats</Text>
              </View>
            ) : (
              STAT_ITEMS.map((stat, idx) => {
                const routeMap: Record<string, string> = {
                  totalProducts: "/(vendor)/(products)",
                  totalOrders: "/(vendor)/(orders)",
                  pendingOrders: "/(vendor)/(orders)",
                  totalCustomers: "/(vendor)/customers",
                };
                const route = routeMap[stat.key] || "";

                return (
                  <Pressable
                    key={idx}
                    className="w-[48%]"
                    style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                    onPress={() => route && router.push(route as any)}
                  >
                    <Card
                      variant="outlined"
                      padding="sm"
                      className="bg-card h-[60px] flex-row items-center justify-start gap-3"
                    >
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: stat.bg }}
                      >
                        <Icon name={stat.icon} size={18} color={stat.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-body-md font-heading font-bold text-foreground">
                          {stats?.[stat.key] ?? "—"}
                        </Text>
                        <Text className="text-[12px] text-muted-foreground font-body leading-tight">
                          {stat.label}
                        </Text>
                      </View>
                    </Card>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>

        {/* ===== RECENT ORDERS ===== */}
        <View className="px-5">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-heading-md font-heading font-bold text-foreground">
              Recent Orders
            </Text>
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push("/(vendor)/(orders)")}
            >
              <Text className="text-body-sm font-bold text-muted-foreground">See All</Text>
            </Pressable>
          </View>

          {!ordersData || ordersData.length === 0 ? (
            <View className="items-center py-8">
              <Text className="text-body-sm text-muted-foreground">No recent orders</Text>
            </View>
          ) : (
            ordersData
              .slice(0, 5)
              .map((order: any) => (
                <OrderCard
                  key={order.id}
                  id={order.id}
                  date={order.date}
                  status={order.status}
                  total={order.total}
                  customerName={order.customerName}
                  items={order.items}
                  actionLabel="Manage Order"
                  onActionPress={() => router.push(`/(vendor)/(orders)/${order.id}`)}
                />
              ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
