import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useDispatcherTransactions } from "@/lib/hooks/use-dispatcher";
import { useState } from "react";

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: transactions, isLoading } = useDispatcherTransactions();
  const [filter, setFilter] = useState<"all" | "order" | "withdrawal">("all");

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

  const filteredTransactions =
    transactions?.filter((t: any) => filter === "all" || t.type === filter) || [];

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-5 py-4 bg-card border-b border-border flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 -ml-2 items-center justify-center rounded-full active:bg-slate-100"
          >
            <Icon name="arrow-left" size={24} color="#0f172a" />
          </Pressable>
          <Text className="text-display-sm font-heading font-bold text-foreground ml-2">
            Transaction History
          </Text>
        </View>
      </View>

      {/* Filters */}
      <View className="px-5 py-4 flex-row gap-2">
        {(["all", "order", "withdrawal"] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            className={`px-4 py-2 rounded-full border ${filter === f ? "bg-foreground border-foreground" : "bg-card border-border"}`}
          >
            <Text
              className={`text-body-md font-bold capitalize ${filter === f ? "text-background" : "text-muted-foreground"}`}
            >
              {f === "order" ? "Earnings" : f}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-24">
        {isLoading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="small" color="var(--color-primary)" />
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
              <Icon name="file-text" size={24} color="#94a3b8" />
            </View>
            <Text className="text-body-lg font-bold text-foreground mb-1">
              No Transactions Found
            </Text>
            <Text className="text-body-md text-muted-foreground text-center">
              {filter === "all"
                ? "You haven't made any transactions yet."
                : `You have no ${filter === "order" ? "earning" : filter} transactions.`}
            </Text>
          </View>
        ) : (
          <View className="bg-card rounded-2xl border border-border overflow-hidden">
            {filteredTransactions.map((trx: any, index: number) => {
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
                        className="text-body-lg font-bold font-heading text-foreground mb-0.5"
                        numberOfLines={1}
                      >
                        {trx.title}
                      </Text>
                      <Text className="text-sm font-body text-muted-foreground">{trx.date}</Text>
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
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
