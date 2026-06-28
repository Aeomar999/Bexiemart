import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useDispatcherAnalytics } from "@/lib/hooks/use-dispatcher";

const { width } = Dimensions.get("window");

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: analytics, isLoading } = useDispatcherAnalytics();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-5 py-4 bg-card border-b border-border flex-row items-center justify-between">
        <View className="flex-row items-center">
          <BackButton className="-ml-2 active:bg-slate-100" />
          <Text className="text-display-sm font-heading font-bold text-foreground ml-2">
            Analytics
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-24 pt-6 gap-6">
        {isLoading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="small" color="var(--color-primary)" />
          </View>
        ) : (
          <>
            <View className="bg-primary rounded-2xl p-6 mb-2">
              <Text className="text-white/80 font-body text-body-md mb-1">30-Day Revenue</Text>
              <Text className="text-white font-heading font-black text-[36px] mb-4">
                GH₵ {analytics?.revenue30Days?.toFixed(2) ?? "0.00"}
              </Text>

              <View className="flex-row items-center justify-between border-t border-white/20 pt-4">
                <View>
                  <Text className="text-white/70 font-body text-body-sm mb-1">
                    Total Trips (30 Days)
                  </Text>
                  <Text className="text-white font-heading font-bold text-heading-md">
                    {analytics?.trips30Days ?? 0}
                  </Text>
                </View>
              </View>
            </View>

            <View>
              <Text className="text-heading-md font-bold font-heading text-foreground mb-4">
                Revenue Trends
              </Text>
              <View className="bg-card border border-border rounded-2xl p-5 h-[200px] items-center justify-center">
                {!analytics?.revenueTimeline || analytics.revenueTimeline.length === 0 ? (
                  <Text className="text-muted-foreground font-body">
                    No data available for the last 30 days
                  </Text>
                ) : (
                  <View className="flex-row items-end h-full w-full justify-between pt-4">
                    {analytics.revenueTimeline.slice(-7).map((day: any, i: number) => {
                      const maxAmount = Math.max(
                        ...analytics.revenueTimeline.slice(-7).map((d: any) => d.amount)
                      );
                      const height = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;

                      return (
                        <View key={i} className="items-center w-[12%]">
                          <Text
                            className="text-caption font-body text-muted-foreground mb-2 absolute -top-5"
                            numberOfLines={1}
                          >
                            GH₵{day.amount}
                          </Text>
                          <View
                            className="w-full bg-primary-subtle rounded-t-sm"
                            style={{ height: "100%", justifyContent: "flex-end" }}
                          >
                            <View
                              className="w-full bg-primary rounded-t-sm"
                              style={{ height: `${height}%`, minHeight: height > 0 ? 4 : 0 }}
                            />
                          </View>
                          <Text className="text-caption font-body text-muted-foreground mt-2">
                            {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
