import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Alert, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useTransactions } from "@/lib/hooks/use-wallet";
import { DetailSkeleton } from "@/components/ui/Skeleton";
import {
  getTransactionIcon,
  getTransactionColors,
  isPositiveTransaction,
  formatDate,
  formatTime,
} from "@/lib/utils/wallet";

export default function TransactionReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useTransactions();
  const transactions = data?.transactions ?? data ?? [];
  const tx = Array.isArray(transactions) ? transactions.find((t: any) => t.id === id) : null;

  if (isLoading && !tx) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <DetailSkeleton />
      </View>
    );
  }

  if (!tx) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted-foreground">Transaction not found</Text>
        <Button title="Go Back" className="mt-4" onPress={() => router.back()} />
      </View>
    );
  }

  const colors = getTransactionColors(tx.type);
  const isPositive = isPositiveTransaction(tx.type);

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pb-4 bg-card border-b border-border"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-display-sm font-heading font-black text-foreground">
            Transaction Details
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-20">
        <View className="bg-card rounded-2xl p-6 items-center border border-border mb-6">
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.bg }}
          >
            <Icon name={getTransactionIcon(tx.type)} size={30} color={colors.icon} />
          </View>

          <Text className="text-body-lg text-muted-foreground font-body mb-2">
            {tx.description}
          </Text>
          <Text
            className={`text-[40px] font-black font-heading mb-2 ${isPositive ? "text-emerald-600" : "text-foreground"}`}
          >
            {isPositive ? "+" : "-"}GHS {tx.amount.toFixed(2)}
          </Text>
          <View
            className={`px-4 py-1.5 rounded-full ${tx.status === "COMPLETED" ? "bg-emerald-50" : "bg-amber-50"}`}
          >
            <Text
              className={`text-sm font-bold ${tx.status === "COMPLETED" ? "text-emerald-600" : "text-amber-600"}`}
            >
              {tx.status}
            </Text>
          </View>
        </View>

        <View className="bg-card rounded-2xl p-6 border border-border">
          <View className="flex-row justify-between py-4 border-b border-border">
            <Text className="text-body-lg text-muted-foreground font-body">Transaction ID</Text>
            <Text className="text-body-lg text-foreground font-bold">{tx.reference || tx.id}</Text>
          </View>

          <View className="flex-row justify-between py-4 border-b border-border">
            <Text className="text-body-lg text-muted-foreground font-body">Date</Text>
            <Text className="text-body-lg text-foreground font-bold">{formatDate(tx.date)}</Text>
          </View>

          <View className="flex-row justify-between py-4 border-b border-border">
            <Text className="text-body-lg text-muted-foreground font-body">Time</Text>
            <Text className="text-body-lg text-foreground font-bold">{formatTime(tx.date)}</Text>
          </View>

          {tx.recipient && (
            <View className="flex-row justify-between py-4 border-b border-border">
              <Text className="text-body-lg text-muted-foreground font-body">Recipient</Text>
              <Text className="text-body-lg text-foreground font-bold">{tx.recipient}</Text>
            </View>
          )}
        </View>

        <Button
          title="Share Receipt"
          variant="outline"
          className="mt-6 border-border"
          textClassName="text-muted-foreground"
          leftIcon={<Icon name="share-2" size={18} color="#64748b" />}
          onPress={() => Alert.alert("Share", "Receipt sharing functionality mock")}
        />
      </ScrollView>
    </View>
  );
}
