import { LinearGradient } from "expo-linear-gradient";
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
      <View className="px-5 py-4 bg-card border-b border-border flex-row items-end justify-between">
        <View>
          <Text className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-[2px]">
            Rider
          </Text>
          <Text className="text-display-md font-heading font-black text-foreground">Earnings</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Help"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="w-[36px] h-[36px] rounded-full bg-background border border-border items-center justify-center"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.push("/(dispatcher)/help")}
        >
          <Icon name="help-circle" size={17} color={tokens.textSecondary} />
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
            <View
              className="rounded-[20px] overflow-hidden border border-black/5 mb-8 bg-black"
              style={{
                shadowColor: "#d97706",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.28,
                shadowRadius: 26,
                elevation: 16,
              }}
            >
              <LinearGradient
                colors={tokens.moneyGrad1 as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              />

              <View className="p-6">
                <Text className="text-body-md text-white/80 font-medium mb-1">
                  Available for Withdrawal
                </Text>
                <View className="flex-row items-baseline mb-4 mt-[2px]">
                  <Text
                    className="font-heading text-[44px] leading-[48px] font-black tracking-[-1px] text-white"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {earnings?.availableBalance?.toFixed(2) ?? "0.00"}
                  </Text>
                  <Text className="text-[16px] font-bold text-white/80 ml-[8px]">GH₵</Text>
                </View>

                <View className="flex-row items-center justify-between mb-6">
                  <View>
                    <Text className="text-[12px] text-white/70 uppercase tracking-wider font-bold mb-1">
                      Pending Clearance
                    </Text>
                    <Text className="text-body-lg font-bold text-white tracking-tight">
                      GH₵ {earnings?.pendingClearance?.toFixed(2) ?? "0.00"}
                    </Text>
                  </View>

                  {/* 52px Saturated Quick-Action Circle */}
                  <View className="flex-row gap-[7px]">
                    <Pressable
                      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
                      onPress={() => router.push("/(dispatcher)/(tabs)/(earnings)/withdraw")}
                      className="w-[52px] h-[52px] rounded-full items-center justify-center bg-blue-600 shadow-elevation-2"
                    >
                      <Icon name="arrow-up-right" size={24} color="white" />
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Hairline Strip */}
              <View className="flex-row border-t border-white/20 bg-black/10">
                <Pressable
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className="flex-1 p-4 border-r border-white/20"
                  onPress={() => router.push("/(dispatcher)/(tabs)/(earnings)/analytics")}
                >
                  <Text className="text-[11px] text-white/70 uppercase tracking-wider font-bold mb-1">
                    Today
                  </Text>
                  <Text className="text-[16px] font-bold text-white tracking-tight">
                    GH₵ {earnings?.todayRevenue?.toFixed(2) ?? "0.00"}
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className="flex-1 p-4"
                  onPress={() => router.push("/(dispatcher)/(tabs)/(earnings)/analytics")}
                >
                  <Text className="text-[11px] text-white/70 uppercase tracking-wider font-bold mb-1">
                    This Week
                  </Text>
                  <Text className="text-[16px] font-bold text-white tracking-tight">
                    GH₵ {earnings?.thisWeekRevenue?.toFixed(2) ?? "0.00"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Recent Transactions */}
            <View>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-heading-md font-bold text-foreground">
                  Recent Transactions
                </Text>
                <Pressable
                  onPress={() => router.push("/(dispatcher)/(tabs)/(earnings)/transactions")}
                >
                  <Text className="text-body-md font-bold text-primary">See All</Text>
                </Pressable>
              </View>

              <View className="bg-card rounded-2xl border border-border overflow-hidden">
                {!earnings?.recentTransactions || earnings.recentTransactions.length === 0 ? (
                  <View className="p-8 items-center justify-center">
                    <Icon name="file-text" size={32} color={tokens.textDisabled} />
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
                        className={`h-[56px] px-4 flex-row items-center justify-between ${
                          index < arr.length - 1 ? "border-b border-border" : ""
                        }`}
                        style={({ pressed }) => [
                          { backgroundColor: pressed ? "#f8fafc" : "white" },
                        ]}
                        onPress={() => handleTransactionPress(trx)}
                      >
                        <View className="flex-row items-center flex-1">
                          <View
                            className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                              isWithdrawal ? "bg-rose-50" : "bg-green-50"
                            }`}
                          >
                            <Icon
                              name={isWithdrawal ? "arrow-up-right" : "arrow-down-left"}
                              size={16}
                              color={isWithdrawal ? tokens.error : tokens.success}
                            />
                          </View>
                          <View className="flex-1 pr-2 justify-center">
                            <Text
                              className="text-[14px] font-bold text-foreground mb-0.5"
                              numberOfLines={1}
                            >
                              {trx.title}
                            </Text>
                          </View>
                        </View>
                        <View className="items-end justify-center">
                          <Text
                            className={`text-[14px] font-bold ${
                              isWithdrawal ? "text-foreground" : "text-green-600"
                            }`}
                          >
                            {isWithdrawal ? "" : "+"}GH₵ {Math.abs(trx.amount).toFixed(2)}
                          </Text>
                          <Text className="text-[10px] text-muted-foreground uppercase font-bold mt-0.5">
                            {trx.status} • {trx.date}
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
