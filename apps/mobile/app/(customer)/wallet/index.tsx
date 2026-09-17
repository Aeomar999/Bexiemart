import { tokens } from "@/theme/tokens";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "@/components/ui/BackButton";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { useWallet, useTransactions, useCards } from "@/lib/hooks/use-wallet";
import { useWalletStore } from "@/lib/stores/wallet-store";
import {
  getTransactionIcon,
  getTransactionColors,
  getAmountPrefix,
  formatDate,
  getCardColors,
} from "@/lib/utils/wallet";

const QUICK_ACTIONS = [
  {
    id: "topup",
    label: "Top Up",
    icon: "plus",
    color: tokens.primary,
    route: "/(customer)/wallet/topup",
  },
  {
    id: "send",
    label: "Send",
    icon: "send",
    color: "#7c3aed",
    route: "/(customer)/wallet/transfer",
  },
  {
    id: "cards",
    label: "Cards",
    icon: "credit-card",
    color: "#e11d48",
    route: "/(customer)/wallet/cards",
  },
  {
    id: "request",
    label: "Request",
    icon: "arrow-down-left",
    color: "#059669",
    route: "/(customer)/wallet/request",
  },
];

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { data: walletData, refetch: refetchWallet } = useWallet();
  const { data: txnData, refetch: refetchTxns } = useTransactions();
  const { data: cards, refetch: refetchCards } = useCards();
  const { bexieCoins } = useWalletStore();

  const balance = walletData?.balance ?? 0;
  const currency = walletData?.currency ?? "GHS";
  const transactions = txnData?.data ?? [];
  const defaultCard = cards?.find((c: any) => c.isDefault) || cards?.[0];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchWallet(), refetchTxns(), refetchCards()]);
    setRefreshing(false);
  }, [refetchWallet, refetchTxns, refetchCards]);

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
          <View
            className="mb-8 mt-2 items-center"
            style={{
              height: (cards?.length ?? 0) >= 2 ? 196 : (cards?.length ?? 0) === 1 ? 186 : 136,
              width: "100%",
              position: "relative",
            }}
          >
            {/* Layer 1: Back-most strip — only show when 2+ cards */}
            {(cards?.length ?? 0) >= 2 && (
              <LinearGradient
                colors={getCardColors(cards[1]?.id, cards[1]?.type) as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: "8%",
                  width: "84%",
                  height: 30,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  borderTopWidth: 1,
                  borderColor: "rgba(255,255,255,0.3)",
                  opacity: 0.7,
                }}
              />
            )}

            {/* Layer 2: Middle Card — only show when 1+ cards */}
            {(cards?.length ?? 0) >= 1 ? (
              <Pressable
                onPress={() => router.push("/(customer)/wallet/cards")}
                className="absolute z-10"
                style={{
                  top: (cards?.length ?? 0) >= 2 ? 10 : 0,
                  left: "4%",
                  width: "92%",
                  height: 78,
                  zIndex: 10,
                }}
              >
                <LinearGradient
                  colors={getCardColors(cards[0]?.id, cards[0]?.type) as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    flex: 1,
                    borderTopLeftRadius: 18,
                    borderTopRightRadius: 18,
                    paddingTop: 12,
                    paddingHorizontal: 18,
                    borderTopWidth: 1,
                    borderColor: "rgba(255,255,255,0.4)",
                  }}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 pr-4">
                      <Text
                        className="text-white text-body-lg font-bold tracking-wide"
                        numberOfLines={1}
                      >
                        {cards[0]?.cardholderName}
                      </Text>
                      <Text className="text-white text-sm mt-1.5 font-mono tracking-[0.15em]">
                        •••• •••• •••• {cards[0]?.last4}
                      </Text>
                    </View>
                    <View className="items-end">
                      <View className="flex-row items-center justify-end">
                        <View
                          style={{ transform: [{ rotate: "90deg" }], marginRight: 8, marginTop: 4 }}
                        >
                          <Icon name="wifi" size={16} color="rgba(255,255,255,0.7)" />
                        </View>
                        <Text className="text-white text-display-md font-black italic tracking-widest">
                          {cards[0]?.type?.toUpperCase() || "CARD"}
                        </Text>
                      </View>
                      <Text className="text-white/60 text-caption mt-0.5 font-bold uppercase tracking-widest">
                        Valid {cards[0]?.expiryMonth}/{cards[0]?.expiryYear?.slice(-2)}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            ) : null}

            {/* Layer 3: Front Pocket (Balance) */}
            <View
              className="z-20"
              style={{
                position: "absolute",
                top: (cards?.length ?? 0) >= 2 ? 60 : (cards?.length ?? 0) === 1 ? 50 : 0,
                left: 0,
                width: "100%",
                height: 136,
                zIndex: 20,
              }}
            >
              <LinearGradient
                colors={["#4f2ae8", "#3013a5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flex: 1,
                  borderRadius: 24,
                  paddingTop: 16,
                  paddingHorizontal: 18,
                  paddingBottom: 16,
                  overflow: "hidden",
                  borderTopWidth: 1.5,
                  borderColor: "rgba(255,255,255,0.3)",
                  shadowColor: "#2d1b73",
                  shadowOffset: { width: 0, height: -6 },
                  shadowOpacity: 0.55,
                  shadowRadius: 20,
                  elevation: 10,
                  justifyContent: "space-between",
                }}
              >
                {/* Abstract Pattern inside the card */}
                <View className="absolute top-[-50px] right-[-30px] w-[150px] h-[150px] rounded-full bg-white/5" />

                <View>
                  <Text className="text-[11px] font-bold tracking-[0.12em] uppercase text-white/70">
                    Total balance
                  </Text>
                  <View className="flex-row items-baseline mt-[2px]">
                    <Text className="font-heading text-[44px] leading-[48px] font-black tracking-[-1px] text-white">
                      {showBalance
                        ? Number(balance).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "••••••"}
                    </Text>
                    <Text className="text-[16px] font-bold text-white/80 ml-[8px]">{currency}</Text>
                  </View>
                </View>

                <View className="flex-row justify-between items-center">
                  <Pressable
                    onPress={() => router.push("/(customer)/wallet/link-account")}
                    className="flex-row items-center gap-[7px] px-4 py-[9px] rounded-full border"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderColor: "rgba(255,255,255,0.12)",
                    }}
                  >
                    <Icon name="link" size={15} color="#fff" />
                    <Text className="text-[13px] font-bold text-white">Link account</Text>
                  </Pressable>

                  <View className="flex-row gap-3">
                    <Pressable
                      accessibilityRole="button"
                      className="w-10 h-10 rounded-full items-center justify-center border"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.15)",
                        borderColor: "rgba(255,255,255,0.12)",
                      }}
                      onPress={onRefresh}
                    >
                      <Icon name="refresh-cw" size={17} color="#fff" />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      className="w-10 h-10 rounded-full items-center justify-center border"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.15)",
                        borderColor: "rgba(255,255,255,0.12)",
                      }}
                      onPress={() => setShowBalance(!showBalance)}
                    >
                      <Icon name={showBalance ? "eye-off" : "eye"} size={17} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 24,
              paddingHorizontal: 4,
            }}
          >
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => router.push(action.route as any)}
                style={{ alignItems: "center", gap: 7 }}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: action.color,
                  }}
                >
                  <Icon name={action.icon} size={22} color="#fff" />
                </View>
                <Text className="text-[11px] font-bold text-foreground">{action.label}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push("/(customer)/wallet/rewards")}
            className="mb-8"
          >
            <View
              className="rounded-2xl overflow-hidden shadow-lg"
              style={{
                shadowColor: "#d97706",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.28,
                shadowRadius: 26,
                elevation: 8,
              }}
            >
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
                    Gold tier · BexieCoins
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
                const colors = getTransactionColors(tx.type);
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
                      style={{ backgroundColor: colors.bg }}
                    >
                      <Icon name={getTransactionIcon(tx.type)} size={18} color={colors.icon} />
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
