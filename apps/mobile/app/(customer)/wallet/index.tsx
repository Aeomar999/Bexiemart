import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "@/components/ui/BackButton";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { BalanceCard } from "@/components/ui/BalanceCard";
import { useWallet, useTransactions } from "@/lib/hooks/use-wallet";
import { useWalletStore } from "@/lib/stores/wallet-store";
import { useThemeColors } from "@/theme/useThemeColors";
import { HELD_INFO } from "@/lib/balance";
import {
  getTransactionIcon,
  getTransactionColors,
  getAmountPrefix,
  formatDate,
} from "@/lib/utils/wallet";

// Top up lives on the balance card; the row holds the other money actions.
const QUICK_ACTIONS = [
  { id: "send", label: "Send", icon: "send", route: "/(customer)/wallet/transfer" },
  { id: "request", label: "Request", icon: "arrow-down-left", route: "/(customer)/wallet/request" },
  { id: "cards", label: "Cards", icon: "credit-card", route: "/(customer)/wallet/cards" },
  { id: "link", label: "Link account", icon: "link", route: "/(customer)/wallet/link-account" },
];

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: walletData,
    isLoading: walletLoading,
    isError: walletError,
    refetch: refetchWallet,
  } = useWallet();
  const { data: txnData, refetch: refetchTxns } = useTransactions();
  const { bexieCoins } = useWalletStore();

  const currency = walletData?.currency ?? "GHS";
  const transactions = txnData?.data ?? [];
  const walletStatus = walletLoading ? "loading" : walletError && !walletData ? "error" : "ready";

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchWallet(), refetchTxns()]);
    setRefreshing(false);
  }, [refetchWallet, refetchTxns]);

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-display-sm font-heading font-black text-foreground">Wallet</Text>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="px-5 pt-4">
          <View className="mb-6 mt-2">
            <BalanceCard
              testID="wallet-balance"
              label="Wallet balance"
              available={Number(walletData?.balance ?? 0)}
              held={{
                label: "On hold for orders",
                amount: Number(walletData?.heldInEscrow ?? 0),
                info: HELD_INFO.customer,
              }}
              action={{
                title: "Top up",
                icon: "plus",
                onPress: () => router.push("/(customer)/wallet/topup"),
              }}
              status={walletStatus}
              onRetry={() => refetchWallet()}
            />
          </View>

          <View className="flex-row justify-between mb-6 px-1">
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => router.push(action.route as any)}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                className="items-center gap-2"
                style={{ width: "22%" }}
              >
                <View className="w-12 h-12 rounded-full items-center justify-center bg-primary-subtle">
                  <Icon name={action.icon} size={22} color={colors.primary} />
                </View>
                <Text className="text-caption font-body font-bold text-foreground text-center">
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push("/(customer)/wallet/rewards")}
            className="mb-8"
          >
            <View className="rounded-2xl overflow-hidden " style={{}}>
              <LinearGradient
                colors={["#f59e0b", "#d97706"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  position: "relative",
                }}
              >
                <View className="absolute right-[-16px] top-[-16px] opacity-[0.12]">
                  <Icon name="award" size={96} color="#fff" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/85">
                    BexieCoins
                  </Text>
                  <Text className="font-heading text-[28px] leading-[32px] font-black tracking-[-0.02em] text-white mt-[1px]">
                    {bexieCoins.toLocaleString()}
                  </Text>
                </View>
                <View className="bg-white rounded-full px-4 py-[9px]">
                  <Text className="text-[13px] font-bold text-[#B45309]">Redeem</Text>
                </View>
              </LinearGradient>
            </View>
          </Pressable>
        </View>

        <View className="px-5 pt-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Recent Activity
            </Text>
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push("/(customer)/wallet/transactions")}
            >
              <Text className="text-[12px] font-bold text-primary tracking-[0.1em] uppercase">
                View All
              </Text>
            </Pressable>
          </View>

          {transactions.length === 0 ? (
            <View className="bg-card p-6 rounded-2xl border border-border">
              <EmptyState
                iconName="file-text"
                title="No transactions yet"
                description="Your activity will appear here after your first transaction"
              />
            </View>
          ) : (
            <View className="bg-card rounded-2xl border border-border overflow-hidden">
              {transactions.slice(0, 5).map((tx: any, index: number) => {
                const txColors = getTransactionColors(tx.type);
                const prefix = getAmountPrefix(tx.type);
                const isPositive = prefix === "+";
                const isLast = index === Math.min(transactions.length, 5) - 1;

                return (
                  <Pressable
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    key={tx.id}
                    className={`flex-row items-center p-4 ${!isLast ? "border-b border-border" : ""}`}
                    onPress={() => router.push(`/(customer)/wallet/transaction/${tx.id}`)}
                  >
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: txColors.bg }}
                    >
                      <Icon name={getTransactionIcon(tx.type)} size={18} color={txColors.icon} />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-body-lg font-bold text-foreground font-body"
                        numberOfLines={1}
                      >
                        {tx.description}
                      </Text>
                      <Text className="text-body-sm text-muted-foreground font-body mt-0.5">
                        {formatDate(tx.createdAt ?? tx.date)}
                      </Text>
                    </View>
                    <Text
                      className={`text-body-lg font-bold font-heading ${isPositive ? "text-emerald-600" : "text-foreground"}`}
                    >
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
