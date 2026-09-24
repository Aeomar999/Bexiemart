import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useVendorOrders } from "@/lib/hooks/use-vendor";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";

const FILTERS = ["New", "Processing", "Ready", "Completed", "Cancelled"];

export default function OrdersManagerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("New");

  const { data: orders = [], isLoading, refetch } = useVendorOrders();
  const filteredOrders = orders.filter((o: any) => o.status === activeFilter);
  const counts: Record<string, number> = {};
  orders.forEach((o: any) => {
    counts[o.status] = (counts[o.status] || 0) + 1;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-700";
      case "Processing":
        return "bg-amber-100 text-amber-700";
      case "Ready":
        return "bg-indigo-100 text-indigo-700";
      case "Completed":
        return "bg-green-100 text-success";
      case "Cancelled":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border"
        style={{ paddingTop: Math.max(insets.top, 12) + 12 }}
      >
        <Text className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-[2px]">
          Order Management
        </Text>
        <Text className="text-display-md font-heading font-black text-foreground">Orders</Text>
      </View>

      {/* Filters */}
      <View className="bg-card border-b border-border">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-5 py-3"
          contentContainerClassName="gap-2 pr-10"
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            const count = counts[filter] || 0;

            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                className={`flex-row items-center px-4 py-2 rounded-full border ${isActive ? "bg-foreground border-border" : "bg-card border-border"}`}
              >
                <Text
                  className={`text-sm font-bold ${isActive ? "text-white" : "text-muted-foreground"}`}
                >
                  {filter}
                </Text>
                {count > 0 && (
                  <View
                    className={`ml-2 px-1.5 py-0.5 rounded-full ${isActive ? "bg-card/20" : "bg-muted"}`}
                  >
                    <Text
                      className={`text-caption font-bold ${isActive ? "text-white" : "text-muted-foreground"}`}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-24 pt-2"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <View className="w-full max-w-2xl mx-auto">
          {isLoading ? (
            <View className="items-center justify-center py-20">
              <ListSkeleton />
            </View>
          ) : filteredOrders.length === 0 ? (
            <View className="px-5 mt-4">
              <EmptyState
                iconName="package"
                title={`No ${activeFilter.toLowerCase()} orders`}
                description="When you get an order, it will appear here."
              />
            </View>
          ) : (
            filteredOrders.map((order: any) => {
              const statusClasses = getStatusColor(order.status).split(" ");
              const bgClass = statusClasses[0];
              const textClass = statusClasses[1];

              return (
                <Pressable
                  key={order.id}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => router.push(`/(vendor)/(orders)/${order.id}`)}
                  className="w-full h-[70px] px-5 bg-card border-b border-border flex-row items-center justify-between"
                >
                  <View className="flex-1 justify-center pr-2">
                    <Text
                      className="text-[14px] font-bold text-foreground mb-0.5"
                      numberOfLines={1}
                    >
                      {order.customer}
                    </Text>
                    <Text className="text-[11px] text-muted-foreground font-body">
                      {order.id} • {order.time} • {order.items}{" "}
                      {order.items === 1 ? "item" : "items"}
                    </Text>
                  </View>
                  <View className="items-end justify-center">
                    <Text
                      className="text-[15px] font-black text-foreground font-heading tracking-tight mb-1"
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      GHS {order.total.toFixed(2)}
                    </Text>
                    <View className={`px-2 py-0.5 rounded-full ${bgClass}`}>
                      <Text className={`text-[10px] font-bold uppercase ${textClass}`}>
                        {order.status}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
