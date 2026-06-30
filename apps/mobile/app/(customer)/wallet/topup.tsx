import { tokens } from "@/theme/tokens";
import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, TextInput, Keyboard, Pressable } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import Toast from "@/lib/toast-polyfill";
import { useWallet } from "@/lib/hooks/use-wallet";
import { useTopUp } from "@/lib/hooks/use-wallet";

const AMOUNTS = [50, 100, 200, 500, 1000];
const PAYMENT_METHODS = [
  { id: "momo", label: "Mobile Money", icon: "smartphone" },
  { id: "card", label: "Credit/Debit Card", icon: "credit-card" },
  { id: "bank", label: "Bank Transfer", icon: "briefcase" },
];

export default function TopUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("momo");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [payUrl, setPayUrl] = useState("");

  const { data: walletData } = useWallet();
  const topUpMutation = useTopUp();

  const handleTopUp = async () => {
    Keyboard.dismiss();
    const numAmount = parseFloat(amount);
    if (!numAmount || !selectedMethod) return;

    setIsProcessing(true);
    try {
      const result = await topUpMutation.mutateAsync({
        amount: numAmount,
        channel: selectedMethod,
      });
      if (result?.authorizationUrl) {
        setPayUrl(result.authorizationUrl);
      }
      setIsSuccess(true);
    } catch (error) {
      console.error("Top-up failed", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAmountSelect = (val: number) => {
    Keyboard.dismiss();
    setAmount(val.toString());
  };

  const handleMethodSelect = (methodId: string) => {
    Keyboard.dismiss();
    setSelectedMethod(methodId);
  };

  if (isSuccess) {
    return (
      <View
        className="flex-1 bg-primary justify-center items-center px-5"
        style={{ paddingTop: insets.top }}
      >
        <View className="w-20 h-20 bg-card rounded-full items-center justify-center mb-6">
          <Icon name="check" size={40} color="#10b981" />
        </View>
        <Text className="text-display-lg font-black text-white font-heading text-center mb-2">
          Top-Up Initiated!
        </Text>
        <Text className="text-body-lg text-white/80 font-body text-center mb-10 px-4">
          GHS {parseFloat(amount || "0").toFixed(2)} - Complete payment to add funds.
        </Text>
        {payUrl ? (
          <Button
            title="Complete Payment"
            variant="primary"
            className="w-full bg-card border-0 mb-3"
            onPress={() =>
              Toast.show({ type: "info", text1: "Pay", text2: "Opening payment page..." })
            }
          />
        ) : null}
        <Button
          title="Back to Wallet"
          variant="outline"
          className="w-full bg-card/10 border-card/20"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  const isValidAmount = parseFloat(amount || "0") > 0;

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-display-sm font-heading font-black text-foreground">
            Top Up Wallet
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      >
        <Text className="text-body-md font-bold text-muted-foreground font-heading mb-2 ml-1 mt-2">
          Amount to Add
        </Text>
        <View className="bg-background p-4 rounded-2xl mb-6 flex-row items-center">
          <Text className="text-display-sm font-bold text-foreground mr-2">GHS</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor="#cbd5e1"
            maxLength={6}
            style={{
              flex: 1,
              fontSize: 32,
              fontWeight: "900",
              color: "#0f172a",
              padding: 0,
              margin: 0,
            }}
          />
        </View>

        <View className="flex-row flex-wrap gap-3 mb-8">
          {AMOUNTS.map((amt) => {
            const isActive = amount === amt.toString();
            return (
              <Pressable
                key={amt}
                onPress={() => handleAmountSelect(amt)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: isActive ? "#bfdbfe" : "#e2e8f0",
                  backgroundColor: isActive ? "#eff6ff" : "#ffffff",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: isActive ? "#1d4ed8" : "#475569",
                    textAlign: "center",
                  }}
                >
                  +{amt}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="text-body-lg font-bold text-foreground font-heading mb-4 px-1">
          Payment Method
        </Text>
        <View
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: 20,
            overflow: "hidden",
            marginBottom: 32,
          }}
        >
          {PAYMENT_METHODS.map((method, idx) => {
            const isSelected = selectedMethod === method.id;
            const isLast = idx === PAYMENT_METHODS.length - 1;
            return (
              <Pressable
                key={method.id}
                onPress={() => handleMethodSelect(method.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: "#f1f5f9",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                    backgroundColor: isSelected ? "#ffffff" : "#e2e8f0",
                  }}
                >
                  <Icon
                    name={method.icon}
                    size={18}
                    color={isSelected ? tokens.primary : "#64748b"}
                  />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: "700",
                    color: isSelected ? "#1d4ed8" : "#475569",
                  }}
                >
                  {method.label}
                </Text>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: isSelected ? "#3b82f6" : "#cbd5e1",
                    backgroundColor: isSelected ? "#3b82f6" : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isSelected && <Icon name="check" size={10} color="#fff" />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 20),
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#f1f5f9",
        }}
      >
        <Button
          title={isProcessing ? "Processing..." : `Top Up GHS ${amount || "0"}`}
          size="lg"
          disabled={!isValidAmount || isProcessing}
          className="w-full rounded-xl"
          onPress={handleTopUp}
        />
      </View>
    </View>
  );
}
