import { tokens } from "@/theme/tokens";
import { BackButton } from "@/components/ui/BackButton";
import {
  View,
  Text,
  ScrollView,
  Alert,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { usePopupStore } from "@/lib/stores/popup-store";
import { useVendorEarnings } from "@/lib/hooks/use-vendor";
import {
  useBankAccounts,
  useMomoAccounts,
  usePinStatus,
  useWithdraw,
} from "@/lib/hooks/use-wallet";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { formatMoney } from "@/lib/money";

export default function WithdrawFundsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const showPopup = usePopupStore((s) => s.showPopup);

  const [amount, setAmount] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState("");

  const { data: earnings } = useVendorEarnings();
  const { data: bankAccounts = [] } = useBankAccounts();
  const { data: momoAccounts = [] } = useMomoAccounts();
  const { data: pinStatus } = usePinStatus();
  const withdrawMutation = useWithdraw();

  const availableBalance = Number(earnings?.availableBalance ?? 0);
  const methods = [
    ...bankAccounts.map((b: any) => ({
      id: b.id,
      accountType: "bank" as const,
      title: b.bankName,
      account: b.accountNumber,
      icon: "briefcase" as const,
    })),
    ...momoAccounts.map((m: any) => ({
      id: m.id,
      accountType: "momo" as const,
      title: m.provider,
      account: m.phoneNumber,
      icon: "smartphone" as const,
    })),
  ];
  const effectiveSelectedMethod =
    selectedMethod && methods.some((m) => m.id === selectedMethod)
      ? selectedMethod
      : (methods[0]?.id ?? "");

  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");

  const numAmount = amount;
  const fee = numAmount > 0 ? 5.0 : 0; // Flat fee of 5 GHS
  const totalDeduction = numAmount + fee;

  const handleWithdrawRequest = () => {
    if (numAmount <= 0) {
      showPopup({
        type: "error",
        title: "Invalid Amount",
        message: "Please enter a valid amount to withdraw.",
      });
      return;
    }

    if (totalDeduction > availableBalance) {
      showPopup({
        type: "error",
        title: "Insufficient Funds",
        message: "The total deduction exceeds your available balance.",
      });
      return;
    }

    setShowPinModal(true);
  };

  const handlePinEntry = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);

      if (newPin.length === 4) {
        setTimeout(() => executeWithdrawal(newPin), 300);
      }
    }
  };

  const handlePinDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const executeWithdrawal = (enteredPin: string) => {
    setShowPinModal(false);
    const selected = methods.find((m) => m.id === effectiveSelectedMethod);
    if (!selected) {
      showPopup({ type: "error", title: "No account", message: "Add a payout account first." });
      return;
    }
    withdrawMutation.mutate(
      {
        amount: numAmount,
        accountId: selected.id,
        accountType: selected.accountType,
        pin: enteredPin,
      },
      {
        onSuccess: () => {
          setPin("");
          showPopup({
            type: "success",
            title: "Withdrawal Requested",
            message: `GHS ${numAmount.toFixed(2)} is being sent to your ${selected.title} account.`,
          });
          router.back();
        },
        onError: (error: any) => {
          setPin("");
          showPopup({
            type: "error",
            title: "Withdrawal Failed",
            message: error?.message || "Check your PIN and try again.",
          });
        },
      }
    );
  };

  const handleMaxAmount = () => {
    const maxAmount = Math.max(0, availableBalance - 5.0);
    setAmount(maxAmount);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-display-sm font-heading font-black text-foreground">
            Withdraw Funds
          </Text>
        </View>
      </View>

      {methods.length === 0 ? (
        <View className="m-5 p-5 bg-card border border-border rounded-2xl items-center">
          <Icon name="credit-card" size={28} color="#94a3b8" />
          <Text className="text-body-lg font-bold text-foreground mt-3 mb-1">
            No payout account
          </Text>
          <Text className="text-body-sm text-muted-foreground text-center mb-4">
            Link a bank or mobile money account to receive withdrawals.
          </Text>
          <Button
            title="Add payout account"
            onPress={() => router.push("/(customer)/wallet/link-account/momo")}
          />
        </View>
      ) : !pinStatus?.hasPin ? (
        <View className="m-5 p-5 bg-card border border-border rounded-2xl items-center">
          <Icon name="lock" size={28} color="#94a3b8" />
          <Text className="text-body-lg font-bold text-foreground mt-3 mb-1">
            Set a withdrawal PIN
          </Text>
          <Text className="text-body-sm text-muted-foreground text-center mb-4">
            Your 4-digit PIN authorizes every payout.
          </Text>
          <Button
            title="Set up PIN"
            onPress={() => router.push("/(vendor)/(settings)/change-pin")}
          />
        </View>
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-5 pb-32 pt-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Amount Input Card */}
            <View className="bg-white rounded-3xl p-6 mb-8 border border-border shadow-sm shadow-sm/50 mt-4">
              <View className="flex-row justify-between items-center mb-6">
                <View className="flex-row items-center bg-primary-subtle px-3 py-1.5 rounded-full border border-border">
                  <Icon name="info" size={14} color={tokens.primary} style={{ marginRight: 6 }} />
                  <Text className="text-body-sm font-bold text-primary-hover">
                    Available: GHS {availableBalance.toFixed(2)}
                  </Text>
                </View>
                <Pressable onPress={handleMaxAmount} className="bg-muted px-3 py-1.5 rounded-full">
                  <Text className="text-body-sm font-bold text-muted-foreground">Withdraw Max</Text>
                </Pressable>
              </View>

              <View className="py-2">
                <MoneyInput
                  value={amount}
                  onChangeValue={setAmount}
                  size="lg"
                  align="center"
                  autoFocus
                />
              </View>
            </View>

            {/* Payment Method */}
            <View className="mb-8">
              <Text className="text-body-md font-bold text-muted-foreground mb-4 ml-2 uppercase tracking-wider">
                Transfer To
              </Text>
              <View className="bg-white rounded-2xl border border-border p-2 shadow-sm shadow-sm/30">
                {methods.map((method, index) => {
                  const isSelected = effectiveSelectedMethod === method.id;

                  return (
                    <Pressable
                      key={method.id}
                      onPress={() => setSelectedMethod(method.id)}
                      className={`p-4 rounded-2xl flex-row items-center ${isSelected ? "bg-primary-subtle border border-border" : "bg-transparent border border-transparent"}`}
                      style={
                        !isSelected && index < methods.length - 1
                          ? { borderBottomColor: "#f1f5f9", borderBottomWidth: 1, borderRadius: 0 }
                          : {}
                      }
                    >
                      <View
                        className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${isSelected ? "bg-primary" : "bg-muted"}`}
                      >
                        <Icon
                          name={method.icon}
                          size={24}
                          color={isSelected ? "#fff" : "#64748b"}
                        />
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`text-body-lg font-bold mb-0.5 tracking-tight ${isSelected ? "text-foreground" : "text-foreground"}`}
                        >
                          {method.title}
                        </Text>
                        <Text
                          className={`text-sm font-body ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                        >
                          {method.account}
                        </Text>
                      </View>
                      <View
                        className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? "border-primary bg-primary" : "border-border bg-transparent"}`}
                      >
                        {isSelected && <Icon name="check" size={12} color="#ffffff" />}
                      </View>
                    </Pressable>
                  );
                })}

                <Pressable
                  className="mt-2 p-4 flex-row items-center justify-center border-t border-dashed border-border"
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => router.push("/(customer)/wallet/link-account/momo")}
                >
                  <Icon name="plus" size={18} color={tokens.primary} style={{ marginRight: 8 }} />
                  <Text className="text-body-lg font-bold text-primary">Add Payment Method</Text>
                </Pressable>
              </View>
            </View>

            {/* Receipt Summary */}
            <View className="mb-8">
              <Text className="text-body-md font-bold text-muted-foreground mb-4 ml-2 uppercase tracking-wider">
                Summary
              </Text>
              <View className="bg-white rounded-2xl border border-border p-6 shadow-sm shadow-sm/30">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-body-lg font-body text-muted-foreground">Amount</Text>
                  <Text className="text-body-lg font-bold text-foreground">
                    GHS {numAmount.toFixed(2)}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center mb-5">
                  <Text className="text-body-lg font-body text-muted-foreground">
                    Processing Fee
                  </Text>
                  <Text className="text-body-lg font-bold text-foreground">
                    GHS {fee.toFixed(2)}
                  </Text>
                </View>

                <View className="h-[2px] bg-muted w-full mb-5" style={{ borderStyle: "dashed" }} />

                <View className="flex-row justify-between items-center">
                  <Text className="text-body-lg font-bold text-foreground">Total Deduction</Text>
                  <Text className="text-display-sm font-heading font-black text-primary tracking-tight">
                    GHS {totalDeduction.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Floating Action Button */}
          <View
            className="absolute bottom-0 left-0 right-0 bg-white border-t border-border px-5 pt-4"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <Button
              title={`Withdraw ${formatMoney(numAmount)}`}
              size="lg"
              loading={withdrawMutation.isPending}
              onPress={handleWithdrawRequest}
              disabled={numAmount <= 0}
              className="w-full shadow-lg shadow-none"
            />
          </View>
        </>
      )}

      {/* Secure PIN Entry Modal */}
      <Modal
        visible={showPinModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowPinModal(false);
          setPin("");
        }}
      >
        <View
          className="flex-1 justify-end backdrop-blur-sm"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <View className="bg-white rounded-t-[40px] p-8 pb-12 h-[85%] shadow-2xl">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-display-md font-heading font-black text-foreground tracking-tight">
                Enter PIN
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-10 h-10 bg-muted rounded-full items-center justify-center"
                onPress={() => {
                  setShowPinModal(false);
                  setPin("");
                }}
              >
                <Icon name="x" size={20} color="#0f172a" />
              </Pressable>
            </View>

            <Text className="text-body-lg font-body text-muted-foreground text-center mb-10 px-4">
              Enter your 4-digit security PIN to confirm the withdrawal of{" "}
              <Text className="font-bold text-foreground">GHS {numAmount.toFixed(2)}</Text>.
            </Text>

            {/* PIN Dots */}
            <View className="flex-row justify-center gap-6 mb-16">
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  className={`w-5 h-5 rounded-full border-2 ${pin.length > i ? "bg-primary border-primary" : "bg-transparent border-border"}`}
                />
              ))}
            </View>

            {/* iOS-style Keypad */}
            <View className="flex-row flex-wrap justify-between gap-y-8 px-6 max-w-[320px] self-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Pressable
                  key={num}
                  className="w-[28%] items-center justify-center rounded-full bg-background border border-border shadow-sm shadow-sm/50"
                  style={({ pressed }) => [
                    {
                      aspectRatio: 1,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                      backgroundColor: pressed ? "#e2e8f0" : "#f8fafc",
                    },
                  ]}
                  onPress={() => handlePinEntry(num.toString())}
                >
                  <Text className="text-display-lg font-heading font-black text-foreground">
                    {num}
                  </Text>
                </Pressable>
              ))}
              <View className="w-[28%]" style={{ aspectRatio: 1 }} />
              <Pressable
                className="w-[28%] items-center justify-center rounded-full bg-background border border-border shadow-sm shadow-sm/50"
                style={({ pressed }) => [
                  {
                    aspectRatio: 1,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    backgroundColor: pressed ? "#e2e8f0" : "#f8fafc",
                  },
                ]}
                onPress={() => handlePinEntry("0")}
              >
                <Text className="text-display-lg font-heading font-black text-foreground">0</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete last digit"
                className="w-[28%] items-center justify-center rounded-full"
                style={({ pressed }) => [{ aspectRatio: 1, opacity: pressed ? 0.5 : 1 }]}
                onPress={handlePinDelete}
              >
                <Icon name="delete" size={32} color="#64748b" />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
