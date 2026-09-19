import { tokens } from "@/theme/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { BackButton } from "@/components/ui/BackButton";
import { OrderCard } from "@/components/ui/OrderCard";
import { View, Text, FlatList, ScrollView, Pressable, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import Toast from "@/lib/toast-polyfill";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useOrders } from "@/lib/hooks/use-orders";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  processing: { label: "Processing", color: tokens.warning, bg: "#fef3c7", icon: "loader" },
  shipped: { label: "Shipped", color: tokens.primary, bg: "#e0e7ff", icon: "truck" },
  delivered: { label: "Delivered", color: tokens.success, bg: "#d1fae5", icon: "check-circle" },
  cancelled: { label: "Cancelled", color: tokens.error, bg: "#fee2e2", icon: "x-circle" },
};

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState("all"); // all, active, past
  const { data: orders = [], isPending, isError, refetch } = useOrders();

  const allOrders = orders as any[];
  const activeCount = allOrders.filter((o) => ["processing", "shipped"].includes(o.status)).length;
  const pastCount = allOrders.filter((o) => ["delivered", "cancelled"].includes(o.status)).length;
  const counts: Record<string, number> = {
    all: allOrders.length,
    active: activeCount,
    past: pastCount,
  };

  // Extract first active order for Hero
  const activeOrderHero =
    filter === "all" || filter === "active"
      ? allOrders.find((o) => ["processing", "shipped"].includes(o.status))
      : null;

  const filteredOrders = allOrders
    .filter((order: any) => {
      if (filter === "all") return true;
      if (filter === "active") return ["processing", "shipped"].includes(order.status);
      if (filter === "past") return ["delivered", "cancelled"].includes(order.status);
      return true;
    })
    .filter((o) => o.id !== activeOrderHero?.id);

  if (isPending) {
    return <LoadingState message="Loading your orders..." />;
  }

  if (isError) {
    return <ErrorState message="Failed to load orders." onRetry={refetch} />;
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-display-sm font-heading font-black text-foreground">
            Order History
          </Text>
        </View>

        {/* Filters */}
        <View className="flex-row mt-6 gap-3">
          {["all", "active", "past"].map((f) => (
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              key={f}
              onPress={() => setFilter(f)}
              className={`flex-row items-center px-4 py-2 rounded-full border ${
                filter === f ? "bg-foreground border-border" : "bg-card border-border"
              }`}
            >
              <Text
                className={`text-[14px] font-bold capitalize ${
                  filter === f ? "text-white" : "text-muted-foreground"
                }`}
              >
                {f}
              </Text>
              {counts[f] > 0 && (
                <View
                  className={`ml-2 px-1.5 py-0.5 rounded-full ${filter === f ? "bg-card/20" : "bg-muted"}`}
                >
                  <Text
                    className={`text-[11px] font-bold ${filter === f ? "text-white" : "text-muted-foreground"}`}
                  >
                    {counts[f]}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Order List */}
      {activeOrderHero && (
        <View className="px-5 mt-6 mb-2">
          <Pressable
            className="rounded-[20px] overflow-hidden border border-black/5 bg-black"
            onPress={() => router.push("/(customer)/track-order")}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.9 : 1,
                shadowColor: tokens.primary,
                shadowOffset: { width: 0, height: 14 },
                shadowOpacity: 0.26,
                shadowRadius: 30,
                elevation: 2,
              },
            ]}
          >
            <LinearGradient
              colors={[tokens.moneyGrad1, tokens.moneyGrad2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <View className="p-6">
              <View className="flex-row justify-between items-start mb-4">
                <View>
                  <Text className="text-[12px] font-bold text-white/80 uppercase tracking-wider mb-1">
                    In Transit
                  </Text>
                  <Text className="text-[18px] font-bold text-white">
                    Order #{activeOrderHero.id}
                  </Text>
                </View>
                <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
                  <Icon name="truck" size={18} color="white" />
                </View>
              </View>

              <Text className="text-[13px] font-body text-white/80 mb-6" numberOfLines={1}>
                {activeOrderHero.items.map((i: any) => `${i.qty}x ${i.name}`).join(", ")}
              </Text>

              <View className="flex-row justify-between items-center border-t border-white/10 pt-4">
                <Text
                  className="font-heading text-[24px] font-black tracking-tight text-white"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  GHS {activeOrderHero.total.toFixed(2)}
                </Text>
                <View className="bg-white rounded-full px-4 py-2">
                  <Text className="text-[13px] font-bold text-primary">Track Order</Text>
                </View>
              </View>
            </View>
          </Pressable>
        </View>
      )}

      {filteredOrders.length === 0 && !activeOrderHero ? (
        <View className="flex-1 justify-center">
          <EmptyState
            iconName="package"
            title="No orders found"
            description="You don't have any orders matching this filter."
            actionLabel="Start Shopping"
            onAction={() => router.push("/(customer)/(shop)")}
          />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={tokens.primary} />
          }
          renderItem={({ item }) => (
            <OrderCard
              {...item}
              variant="customer"
              onPress={() => {
                if (item.status !== "delivered" && item.status !== "cancelled") {
                  router.push("/(customer)/track-order");
                } else {
                  Toast.show({
                    type: "info",
                    text1: "Reorder",
                    text2: "Reorder functionality coming soon.",
                  });
                }
              }}
            />
          )}
        />
      )}
    </View>
  );
}
