import { tokens } from "@/theme/tokens";
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

  const filteredOrders = (orders as any[]).filter((order: any) => {
    if (filter === "all") return true;
    if (filter === "active") return ["processing", "shipped"].includes(order.status);
    if (filter === "past") return ["delivered", "cancelled"].includes(order.status);
    return true;
  });

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
              className={`px-5 py-2.5 rounded-full border ${
                filter === f ? "bg-foreground border-border" : "bg-card border-border"
              }`}
            >
              <Text
                className={`text-body-md font-bold capitalize ${
                  filter === f ? "text-white" : "text-muted-foreground"
                }`}
              >
                {f} Orders
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Order List */}
      {filteredOrders.length === 0 ? (
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
