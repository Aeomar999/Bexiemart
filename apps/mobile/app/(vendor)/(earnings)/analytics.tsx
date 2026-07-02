import { RowsSkeleton } from "@/components/ui/Skeleton";
import { tokens } from "@/theme/tokens";
import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useVendorAnalytics } from "@/lib/hooks/use-vendor-analytics";

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: analytics, isLoading, isError } = useVendorAnalytics();

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton className="mr-3" />
        <Text className="text-display-sm font-heading font-black text-foreground">
          Analytics Overview
        </Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <RowsSkeleton />
        ) : isError ? (
          <View className="items-center justify-center py-20">
            <Text className="text-body-sm text-red-500">Failed to load analytics</Text>
          </View>
        ) : (
          <>
            {/* Mock Chart Area */}
            <View className="bg-card p-5 rounded-2xl border border-border mb-6">
              <View className="flex-row justify-between items-end mb-6">
                <View>
                  <Text className="text-sm font-bold text-muted-foreground mb-1">
                    Total Revenue (30 Days)
                  </Text>
                  <Text className="text-display-md font-heading font-black text-foreground">
                    GHS {analytics?.totalRevenue30d?.toFixed(2) ?? "0.00"}
                  </Text>
                </View>
                <View className="bg-green-100 px-2 py-1 rounded-full flex-row items-center">
                  <Icon name="trending-up" size={14} color="#16a34a" style={{ marginRight: 4 }} />
                  <Text className="text-body-sm font-bold text-success">
                    {analytics?.revenueGrowth ?? "+0%"}
                  </Text>
                </View>
              </View>

              <View className="h-40 border-b border-border flex-row items-end justify-between pb-2 pt-4 px-2">
                {(analytics?.chartData ?? [40, 60, 50, 80, 100, 70]).map(
                  (bar: number, i: number) => {
                    const tints = [
                      "bg-primary-subtle",
                      "bg-primary-subtle",
                      "bg-primary-subtle",
                      "bg-primary",
                      "bg-primary",
                      "bg-primary-subtle",
                    ];
                    return (
                      <View
                        key={i}
                        className={`w-8 ${tints[i]} rounded-t-md`}
                        style={{ height: `${bar}%` }}
                      />
                    );
                  }
                )}
              </View>
              <View className="flex-row justify-between mt-2 px-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <Text key={day} className="text-caption text-muted-foreground font-bold">
                    {day}
                  </Text>
                ))}
              </View>
            </View>

            {/* Top Selling Products */}
            <Text className="text-body-lg font-bold text-foreground mb-3 ml-1">
              Top Selling Items
            </Text>
            <View className="bg-card rounded-2xl border border-border overflow-hidden mb-12">
              {(analytics?.topProducts ?? []).map((product: any, index: number, arr: any[]) => (
                <View
                  key={product.id}
                  className={`p-4 flex-row items-center justify-between ${index < arr.length - 1 ? "border-b border-border" : ""}`}
                >
                  <View className="w-10 h-10 rounded-full bg-muted items-center justify-center mr-3">
                    <Text className="text-body-md font-bold text-muted-foreground">
                      #{index + 1}
                    </Text>
                  </View>
                  <View className="flex-1 pr-4">
                    <Text
                      className="text-body-lg font-bold text-foreground mb-0.5"
                      numberOfLines={1}
                    >
                      {product.name}
                    </Text>
                    <Text className="text-body-sm text-muted-foreground">
                      {product.sales} units sold
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-body-md font-bold text-foreground">
                      GHS {product.revenue.toFixed(2)}
                    </Text>
                    <Text
                      className={`text-body-sm font-bold mt-0.5 ${product.trend?.startsWith("+") ? "text-green-600" : "text-red-500"}`}
                    >
                      {product.trend}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
