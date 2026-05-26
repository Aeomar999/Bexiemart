import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { useWallet, useTransactions } from "@/lib/hooks/use-wallet";
import { useWalletStore } from "@/lib/stores/wallet-store";
import {
  getTransactionIcon,
  getTransactionColors,
  getAmountPrefix,
  formatDate,
} from "@/lib/utils/wallet";

const QUICK_ACTIONS = [
  { id: "topup", label: "Top Up", icon: "plus", color: "#004CFF", route: "/(customer)/wallet/topup" },
  { id: "send", label: "Send", icon: "send", color: "#7c3aed", route: "/(customer)/wallet/transfer" },
  { id: "request", label: "Request", icon: "arrow-down-left", color: "#059669", route: "/(customer)/wallet/request" },
];

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { data: walletData, refetch: refetchWallet } = useWallet();
  const { data: txnData, refetch: refetchTxns } = useTransactions();
  const { bexieCoins } = useWalletStore();

  const balance = walletData?.balance ?? 0;
  const currency = walletData?.currency ?? "GHS";
  const accountName = walletData?.accountName ?? "BexieMart User";
  const accountNumber = walletData?.accountNumber ?? "BXM-0000-0000";
  const transactions = txnData?.transactions ?? txnData ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchWallet(), refetchTxns()]);
    setRefreshing(false);
  }, [refetchWallet, refetchTxns]);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-5 pt-4">
          <View className="rounded-[24px] overflow-hidden shadow-sm bg-card border border-border mb-6">
            <View className="p-6">
              <View className="flex-row justify-between items-start mb-6">
                <View>
                  <Text className="text-muted-foreground text-body-sm font-medium font-body mb-1">
                    Available Balance
                  </Text>
                  <Pressable onPress={() => setShowBalance(!showBalance)}>
                    <Text className="text-foreground text-display-md font-heading font-bold tracking-tight">
                      {showBalance ? `${currency} ${Number(balance).toFixed(2)}` : "••••••"}
                    </Text>
                  </Pressable>
                </View>
                <View className="w-10 h-10 rounded-full bg-background items-center justify-center">
                  <Icon name="credit-card" size={20} color="#0f172a" />
                </View>
              </View>

              <View className="flex-row justify-between items-end border-t border-border pt-4">
                <View>
                  <Text className="text-muted-foreground text-caption font-body uppercase tracking-wider mb-0.5">
                    {accountName}
                  </Text>
                  <Text className="text-foreground text-body-sm font-medium font-body">
                    {accountNumber}
                  </Text>
                </View>
                <View>
                  <Text className="text-muted-foreground text-caption font-body uppercase tracking-wider mb-0.5">Currency</Text>
                  <Text className="text-foreground text-body-md font-bold font-heading">{currency}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 32, paddingHorizontal: 8 }}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => router.push(action.route as any)}
                style={{ alignItems: "center" }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                    backgroundColor: action.color,
                  }}
                >
                  <Icon name={action.icon} size={24} color="#ffffff" />
                </View>
                <Text className="text-body-sm font-bold text-foreground font-body">{action.label}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push("/(customer)/wallet/rewards")}
            className="mb-8"
          >
            <View className="rounded-[24px] shadow-sm overflow-hidden">
              <LinearGradient
                colors={["#f59e0b", "#d97706"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ padding: 20, position: "relative" }}
              >
                <View className="absolute right-[-20px] top-[-20px] opacity-10">
                  <Icon name="award" size={120} color="#fff" />
                </View>
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-[14px] font-heading font-bold text-white/90 uppercase tracking-wider">Gold Tier</Text>
                  <View className="bg-card/20 px-3 py-1 rounded-full">
                    <Text className="text-[12px] font-bold text-white">How to earn</Text>
                  </View>
                </View>
                <Text className="text-[28px] font-black text-white font-heading mb-1">{bexieCoins.toLocaleString()}</Text>
                <Text className="text-[14px] text-white/80 font-medium font-body">BexieCoins Available</Text>
              </LinearGradient>
            </View>
          </Pressable>
        </View>

        <View className="px-5">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[18px] font-heading font-bold text-foreground">
              Recent Activity
            </Text>
            <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]} onPress={() => router.push("/(customer)/wallet/transactions")}>
              <Text className="text-[14px] font-bold text-brand-600 font-body">
                View All
              </Text>
            </Pressable>
          </View>

          {transactions.length === 0 ? (
            <View className="bg-card p-6 rounded-[24px] border border-border">
              <EmptyState
                icon="file-text"
                title="No transactions yet"
                description="Your activity will appear here after your first transaction"
              />
            </View>
          ) : (
            <View className="bg-card rounded-[24px] border border-border overflow-hidden">
              {transactions.slice(0, 5).map((tx: any, index: number) => {
                const colors = getTransactionColors(tx.type);
                const prefix = getAmountPrefix(tx.type);
                const isPositive = prefix === "+";
                const isLast = index === Math.min(transactions.length, 5) - 1;

                return (
                  <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    key={tx.id}
                    className={`flex-row items-center p-4 ${!isLast ? "border-b border-border" : ""}`}
                    onPress={() => router.push(`/(customer)/wallet/transaction/${tx.id}`)}
                  >
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.bg }}>
                      <Icon name={getTransactionIcon(tx.type)} size={18} color={colors.icon} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-bold text-foreground font-body" numberOfLines={1}>
                        {tx.description}
                      </Text>
                      <Text className="text-[12px] text-muted-foreground font-body mt-0.5">
                        {formatDate(tx.createdAt ?? tx.date)}
                      </Text>
                    </View>
                    <Text className={`text-[15px] font-bold font-heading ${isPositive ? "text-emerald-600" : "text-foreground"}`}>
                      {prefix} {currency} {Number(tx.amount || tx.netAmount).toFixed(2)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
