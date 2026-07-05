import { RowsSkeleton } from "@/components/ui/Skeleton";
import { tokens } from "@/theme/tokens";
import { View, Text, ScrollView, Pressable, Alert, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useState, useCallback } from "react";
import { useVendorTransactions } from "@/lib/hooks/use-vendor-analytics";

const FILTERS = ["All", "Orders", "Withdrawals"];

export default function TransactionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const { data: transactions, isLoading, isError, refetch } = useVendorTransactions();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const allTransactions = transactions ?? [];

  const filteredTransactions = allTransactions.filter((trx: any) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Orders") return trx.type === "order";
    if (activeFilter === "Withdrawals") return trx.type === "withdrawal";
    return true;
  });

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
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          className="w-10 h-10 rounded-full bg-background items-center justify-center mr-3"
          onPress={() => router.back()}
        >
          <Icon name="arrow-left" size={20} color="#0f172a" />
        </Pressable>
        <Text className="text-display-sm font-heading font-black text-foreground">
          Transaction History
        </Text>
      </View>

      <View className="bg-card border-b border-border">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-5 py-3"
          contentContainerClassName="gap-2 pr-10"
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full border ${isActive ? "bg-foreground border-border" : "bg-card border-border"}`}
              >
                <Text
                  className={`text-sm font-bold ${isActive ? "text-white" : "text-muted-foreground"}`}
                >
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-6 pb-12"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.primary}
          />
        }
      >
        <View className="bg-card rounded-2xl border border-border overflow-hidden mb-12">
          {isLoading ? (
            <RowsSkeleton />
          ) : isError ? (
            <View className="p-10 items-center justify-center">
              <Text className="text-body-lg font-bold text-red-500">
                Failed to load transactions
              </Text>
            </View>
          ) : filteredTransactions.length === 0 ? (
            <View className="p-10 items-center justify-center">
              <Icon name="file-text" size={32} color="#cbd5e1" style={{ marginBottom: 12 }} />
              <Text className="text-body-lg font-bold text-foreground">No Transactions</Text>
              <Text className="text-sm text-muted-foreground text-center mt-1">
                You have no {activeFilter.toLowerCase()} history.
              </Text>
            </View>
          ) : (
            filteredTransactions.map((trx: any, index: number) => {
              const isWithdrawal = trx.type === "withdrawal";
              return (
                <Pressable
                  key={trx.id}
                  className={`p-4 flex-row items-center justify-between ${index < filteredTransactions.length - 1 ? "border-b border-border" : ""}`}
                  style={({ pressed }) => [{ backgroundColor: pressed ? "#f8fafc" : "white" }]}
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
                        className="text-body-lg font-bold text-foreground mb-0.5"
                        numberOfLines={1}
                      >
                        {trx.title}
                      </Text>
                      <Text className="text-sm text-muted-foreground">{trx.date}</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text
                      className={`text-body-lg font-bold ${isWithdrawal ? "text-foreground" : "text-green-600"}`}
                    >
                      {isWithdrawal ? "" : "+"}GHS {Math.abs(trx.amount).toFixed(2)}
                    </Text>
                    <Text className="text-body-sm text-muted-foreground capitalize mt-0.5">
                      {trx.status}
                    </Text>
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
