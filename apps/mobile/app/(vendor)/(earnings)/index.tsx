import { tokens } from "@/theme/tokens";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { BalanceCard } from "@/components/ui/BalanceCard";
import { EarningsStatTiles } from "@/components/ui/EarningsStatTiles";
import { useVendorEarnings } from "@/lib/hooks/use-vendor";
import { HELD_INFO } from "@/lib/balance";

export default function EarningsDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: earnings, isLoading, isError, refetch } = useVendorEarnings();
  const status = isLoading ? "loading" : isError && !earnings ? "error" : "ready";

  const handleTransactionPress = (trx: any) => {
    if (trx.type === "order") {
      router.push(`/(vendor)/(orders)/${trx.orderId}`);
    } else {
      Alert.alert(
        "Withdrawal Receipt",
        `Transaction ID: ${trx.id}\nAmount: GHS ${Math.abs(trx.amount).toFixed(2)}\nStatus: ${trx.status.toUpperCase()}\nDate: ${trx.date}`,
        [{ text: "Close", style: "cancel" }]
      );
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-end justify-between"
        style={{ paddingTop: Math.max(insets.top, 12) + 12 }}
      >
        <View>
          <Text className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-[2px]">
            Vendor
          </Text>
          <Text className="text-display-md font-heading font-black text-foreground">Earnings</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Help"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="w-[36px] h-[36px] rounded-full bg-background border border-border items-center justify-center"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.push("/(vendor)/(settings)/help")}
        >
          <Icon name="help-circle" size={17} color={tokens.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="pb-24 pt-6 gap-6"
        showsVerticalScrollIndicator={false}
      >
        <BalanceCard
          testID="vendor-balance"
          label="Available to withdraw"
          available={Number(earnings?.availableBalance ?? 0)}
          held={{
            label: "Pending clearance",
            amount: Number(earnings?.pendingClearance ?? 0),
            info: HELD_INFO.vendor,
          }}
          action={{
            title: "Withdraw",
            icon: "arrow-up-right",
            onPress: () => router.push("/(vendor)/(earnings)/withdraw"),
          }}
          status={status}
          onRetry={() => refetch()}
        />

        {status !== "error" && (
          <EarningsStatTiles
            today={Number(earnings?.todayRevenue ?? 0)}
            thisWeek={Number(earnings?.thisWeekRevenue ?? 0)}
            loading={status === "loading"}
            onPress={() => router.push("/(vendor)/(earnings)/analytics")}
          />
        )}

        {status === "ready" && (
          <View>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-heading-md font-bold text-foreground">Recent Transactions</Text>
              <Pressable onPress={() => router.push("/(vendor)/(earnings)/transactions")}>
                <Text className="text-body-md font-bold text-primary">See All</Text>
              </Pressable>
            </View>

            <View className="bg-card rounded-2xl border border-border overflow-hidden">
              {(earnings?.recentTransactions ?? []).map((trx: any, index: number, arr: any[]) => {
                const isWithdrawal = trx.type === "withdrawal";

                return (
                  <Pressable
                    key={trx.id}
                    className={`h-[56px] px-4 flex-row items-center justify-between ${
                      index < arr.length - 1 ? "border-b border-border" : ""
                    }`}
                    style={({ pressed }) => [{ backgroundColor: pressed ? "#f8fafc" : "white" }]}
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
                        {isWithdrawal ? "" : "+"}GHS {Math.abs(trx.amount).toFixed(2)}
                      </Text>
                      <Text className="text-[10px] text-muted-foreground uppercase font-bold mt-0.5">
                        {trx.status} • {trx.date}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
