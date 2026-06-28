import { View, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useOrder } from "@/lib/hooks/use-orders";

export default function CheckoutSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    orderId,
    paymentMethod,
    deliveryMethod,
    useBexieCoins: useBexieCoinsParam,
  } = useLocalSearchParams<{
    orderId: string;
    paymentMethod: string;
    deliveryMethod: string;
    useBexieCoins: string;
  }>();
  const [stage, setStage] = useState<"processing" | "success" | "failure">("success");

  const { data: order, isLoading, isError } = useOrder(orderId ?? "");

  const parsedTotal = order?.total ?? 0;
  const orderNumber = order?.orderNumber ?? order?.id ?? order?._id ?? "";

  if (isLoading || stage === "processing") {
    return (
      <View
        className="flex-1 bg-background items-center justify-center px-8"
        style={{ paddingTop: insets.top }}
      >
        <View className="w-24 h-24 rounded-full bg-primary-subtle items-center justify-center mb-8">
          <ListSkeleton />
        </View>
        <Text className="text-display-sm font-heading font-bold text-foreground text-center mb-3">
          {stage === "processing" ? "Processing Payment" : "Loading Order"}
        </Text>
        <Text className="text-body-md text-muted-foreground font-body text-center leading-relaxed">
          {paymentMethod === "wallet"
            ? "Deducting from your wallet..."
            : `Processing via ${paymentMethod === "momo" ? "Mobile Money" : "Card"}...`}
        </Text>
        {parsedTotal > 0 && (
          <Text className="text-display-lg font-black text-primary font-heading mt-6">
            GHS {Number(parsedTotal).toFixed(2)}
          </Text>
        )}
      </View>
    );
  }

  if (isError || stage === "failure") {
    return (
      <View
        className="flex-1 bg-background items-center justify-center px-8"
        style={{ paddingTop: insets.top }}
      >
        <View className="w-24 h-24 rounded-full bg-rose-50 items-center justify-center mb-8">
          <Icon name="alert-circle" size={48} color="#ef4444" />
        </View>
        <Text className="text-display-sm font-heading font-bold text-foreground text-center mb-3">
          Payment Failed
        </Text>
        <Text className="text-body-md text-muted-foreground font-body text-center leading-relaxed mb-8">
          Your payment could not be processed. Please try again or use a different payment method.
        </Text>
        <View className="gap-3 w-full px-8">
          <Button
            title="Try Again"
            size="lg"
            onPress={() => {
              setStage("processing");
              router.back();
            }}
            className="w-full rounded-full"
          />
          <Button
            title="Back to Cart"
            variant="outline"
            size="lg"
            onPress={() => router.replace("/(customer)/cart")}
            className="w-full rounded-full"
          />
        </View>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-background items-center justify-center px-8"
      style={{ paddingTop: insets.top }}
    >
      <View className="absolute top-4 left-5 z-10" style={{ top: insets.top + 8 }}>
        <BackButton onPress={() => router.replace("/(customer)/orders")} />
      </View>
      <View className="w-24 h-24 rounded-full bg-emerald-50 items-center justify-center mb-8">
        <Icon name="check-circle" size={48} color="#10b981" />
      </View>
      <Text className="text-display-sm font-heading font-bold text-foreground text-center mb-3">
        Payment Successful
      </Text>
      <Text className="text-body-md text-muted-foreground font-body text-center leading-relaxed mb-3">
        Your order has been placed successfully. You will receive a confirmation shortly.
      </Text>
      <View className="bg-card rounded-2xl p-6 w-full border border-border mb-8 gap-3">
        <View className="flex-row justify-between py-1.5 border-b border-border">
          <Text className="text-body-sm text-muted-foreground font-body">Order Number</Text>
          <Text className="text-body-sm font-bold text-foreground font-heading">{orderNumber}</Text>
        </View>
        <View className="flex-row justify-between py-1.5 border-b border-border">
          <Text className="text-body-sm text-muted-foreground font-body">Total</Text>
          <Text className="text-body-sm font-bold text-primary font-heading">
            GHS {Number(parsedTotal).toFixed(2)}
          </Text>
        </View>
        <View className="flex-row justify-between py-1.5 border-b border-border">
          <Text className="text-body-sm text-muted-foreground font-body">Delivery</Text>
          <Text className="text-body-sm font-semibold text-muted-foreground font-body">
            {deliveryMethod === "express" ? "Express" : "Standard"}
          </Text>
        </View>
        <View className="flex-row justify-between py-1.5">
          <Text className="text-body-sm text-muted-foreground font-body">Date</Text>
          <Text className="text-body-sm font-semibold text-muted-foreground font-body">
            {new Date().toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View className="gap-3 w-full">
        <Button
          title="View Orders"
          size="lg"
          onPress={() => router.replace("/(customer)/orders")}
          className="w-full rounded-full"
        />
        <Button
          title="Continue Shopping"
          variant="outline"
          size="lg"
          onPress={() => router.replace("/(customer)/(shop)")}
          className="w-full rounded-full"
        />
      </View>
    </View>
  );
}
