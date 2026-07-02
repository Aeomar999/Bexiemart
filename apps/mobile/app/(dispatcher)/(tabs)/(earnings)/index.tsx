import { RowsSkeleton } from "@/components/ui/Skeleton";
import { tokens } from "@/theme/tokens";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useDispatcherEarnings } from "@/lib/hooks/use-dispatcher";

export default function EarningsDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: earnings, isLoading, isError } = useDispatcherEarnings();

  const handleTransactionPress = (trx: any) => {
    if (trx.type === "withdrawal") {
      Alert.alert(
        "Withdrawal Receipt",
        `Transaction ID: ${trx.id}\nAmount: GH₵ ${Math.abs(trx.amount).toFixed(2)}\nStatus: ${trx.status.toUpperCase()}\nDate: ${trx.date}`,
        [{ text: "Close", style: "cancel" }]
      );
    } else {
      Alert.alert(
        "Delivery Payout",
        `Transaction ID: ${trx.id}\nAmount: GH₵ ${trx.amount.toFixed(2)}\nStatus: ${trx.status.toUpperCase()}\nDate: ${trx.date}`,
        [{ text: "Close", style: "cancel" }]
      );
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-5 py-4 bg-card border-b border-border flex-row items-center justify-between">
        <Text className="text-display-md font-heading font-black text-foreground">Earnings</Text>
        <Pressable
          className="w-10 h-10 rounded-full bg-background items-center justify-center"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.push("/(dispatcher)/(settings)/help")}
        >
          <Icon name="help-circle" size={20} color="#64748b" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="pb-24 pt-6 gap-6"
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <RowsSkeleton />
        ) : isError ? (
          <View className="items-center justify-center py-20">
            <Text className="text-body-md text-red-500 font-body">Failed to load earnings</Text>
          </View>
        ) : (
          <>
            {/* Balance Card */}
            <View className="bg-primary rounded-2xl p-6 overflow-hidden relative">
              <View className="absolute top-0 right-0 w-32 h-32 bg-card/10 rounded-full -mr-10 -mt-10" />
              <View className="absolute bottom-0 left-0 w-24 h-24 bg-card/10 rounded-full -ml-8 -mb-8" />

              <Text className="text-body-md text-white/80 font-body font-medium mb-1">
                Available for Withdrawal
              </Text>
              <Text className="text-[36px] font-black font-heading text-white leading-tight mb-4">
                GH₵ {earnings?.availableBalance?.toFixed(2) ?? "0.00"}
              </Text>

              <View className="flex-row items-center justify-between mt-2">
                <View>
                  <Text className="text-body-sm font-body text-white/70">Pending Clearance</Text>
                  <Text className="text-body-lg font-bold font-heading text-white">
                    GH₵ {earnings?.pendingClearance?.toFixed(2) ?? "0.00"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push("/(dispatcher)/(tabs)/(earnings)/withdraw")}
                  className="bg-card px-5 py-2.5 rounded-full"
                >
                  <Text className="text-body-md font-bold font-body text-primary">Withdraw</Text>
                </Pressable>
              </View>
            </View>

            {/* Analytics Overview */}
            <View>
              <Text className="text-heading-md font-bold font-heading text-foreground mb-3">
                Overview
              </Text>
              <View className="flex-row gap-3">
                <Pressable
                  className="flex-1 bg-card p-4 rounded-xl border border-border"
                  style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                  onPress={() => router.push("/(dispatcher)/(tabs)/(earnings)/analytics")}
                >
                  <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mb-2">
                    <Icon name="trending-up" size={16} color="#3b82f6" />
                  </View>
                  <Text className="text-body-sm text-muted-foreground font-body mb-1">
                    Today's Revenue
                  </Text>
                  <Text className="text-body-lg font-bold font-heading text-foreground">
                    GH₵ {earnings?.todayRevenue?.toFixed(2) ?? "0.00"}
                  </Text>
                </Pressable>
                <Pressable
                  className="flex-1 bg-card p-4 rounded-xl border border-border"
                  style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                  onPress={() => router.push("/(dispatcher)/(tabs)/(earnings)/analytics")}
                >
                  <View className="w-8 h-8 rounded-full bg-green-50 items-center justify-center mb-2">
                    <Icon name="calendar" size={16} color="#22c55e" />
                  </View>
                  <Text className="text-body-sm text-muted-foreground font-body mb-1">
                    This Week
                  </Text>
                  <Text className="text-body-lg font-bold font-heading text-foreground">
                    GH₵ {earnings?.thisWeekRevenue?.toFixed(2) ?? "0.00"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Recent Transactions */}
            <View>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-heading-md font-bold font-heading text-foreground">
                  Recent Transactions
                </Text>
                <Pressable
                  onPress={() => router.push("/(dispatcher)/(tabs)/(earnings)/transactions")}
                >
                  <Text className="text-body-md font-bold font-body text-primary">See All</Text>
                </Pressable>
              </View>

              <View className="bg-card rounded-2xl border border-border overflow-hidden">
                {!earnings?.recentTransactions || earnings.recentTransactions.length === 0 ? (
                  <View className="p-8 items-center justify-center">
                    <Icon name="file-text" size={32} color="#cbd5e1" />
                    <Text className="text-muted-foreground font-body mt-2">
                      No recent transactions
                    </Text>
                  </View>
                ) : (
                  earnings.recentTransactions.map((trx: any, index: number, arr: any[]) => {
                    const isWithdrawal = trx.type === "withdrawal";

                    return (
                      <Pressable
                        key={trx.id}
                        className={`p-4 flex-row items-center justify-between ${index < arr.length - 1 ? "border-b border-border" : ""}`}
                        style={({ pressed }) => [
                          { backgroundColor: pressed ? "#f8fafc" : "white" },
                        ]}
                        onPress={() => handleTransactionPress(trx)}
                      >
                        <View className="flex-row items-center flex-1">
                          <View
                            className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isWithdrawal ? "bg-rose-50" : "bg-green-50"}`}
                          >
                            <Icon
                              name={isWithdrawal ? "arrow-up-right" : "arrow-down-left"}
                              size={18}
                              color={isWithdrawal ? "#e11d48" : "#16a34a"}
                            />
                          </View>
                          <View className="flex-1 pr-4">
                            <Text
                              className="text-body-lg font-bold font-heading text-foreground mb-0.5"
                              numberOfLines={1}
                            >
                              {trx.title}
                            </Text>
                            <Text className="text-sm font-body text-muted-foreground">
                              {trx.date}
                            </Text>
                          </View>
                        </View>
                        <View className="items-end">
                          <Text
                            className={`text-body-lg font-bold font-heading ${isWithdrawal ? "text-foreground" : "text-green-600"}`}
                          >
                            {isWithdrawal ? "" : "+"}GH₵ {Math.abs(trx.amount).toFixed(2)}
                          </Text>
                          <Text className="text-body-sm font-body text-muted-foreground capitalize mt-0.5">
                            {trx.status}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
