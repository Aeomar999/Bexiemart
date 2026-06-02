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
import { useWithdrawEarnings } from "@/lib/hooks/use-vendor";

const WITHDRAWAL_METHODS = [
  { id: "momo", title: "Mobile Money", account: "024 **** 567", icon: "smartphone" },
  { id: "bank", title: "Ecobank Ghana", account: "**** **** 1234", icon: "briefcase" },
];

export default function WithdrawFundsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const showPopup = usePopupStore((s) => s.showPopup);

  const [amount, setAmount] = useState("");
  const [methods, setMethods] = useState(WITHDRAWAL_METHODS);
  const [selectedMethod, setSelectedMethod] = useState("momo");

  const withdrawMutation = useWithdrawEarnings();

  // Modals state
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [newMethodType, setNewMethodType] = useState("momo");
  const [newMethodAccount, setNewMethodAccount] = useState("");

  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");

  const availableBalance = 1250.0;
  const numAmount = parseFloat(amount) || 0;
  const fee = numAmount > 0 ? 5.0 : 0; // Flat fee of 5 GHS
  const totalDeduction = numAmount + fee;

  const handleWithdrawRequest = () => {
    if (!amount || numAmount <= 0) {
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
        setTimeout(() => executeWithdrawal(), 300);
      }
    }
  };

  const handlePinDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const executeWithdrawal = () => {
    setShowPinModal(false);
    const destination = methods.find((m) => m.id === selectedMethod)?.account ?? "";
    withdrawMutation.mutate(
      { amount: numAmount, destination },
      {
        onSuccess: () => {
          setPin("");
          showPopup({
            type: "success",
            title: "Withdrawal Successful",
            message: `GHS ${numAmount.toFixed(2)} is on its way to your account.`,
          });
          router.back();
        },
        onError: (error: any) => {
          setPin("");
          showPopup({
            type: "error",
            title: "Withdrawal Failed",
            message: error?.message || "Something went wrong. Please try again.",
          });
        },
      }
    );
  };

  const handleAddMethod = () => {
    if (!newMethodAccount) {
      showPopup({ type: "error", title: "Required", message: "Please enter account details." });
      return;
    }

    const newId = `method_${Date.now()}`;
    const methodToAdd = {
      id: newId,
      title: newMethodType === "momo" ? "Mobile Money" : "Bank Transfer",
      account: newMethodAccount,
      icon: newMethodType === "momo" ? "smartphone" : "briefcase",
    };

    setMethods([...methods, methodToAdd]);
    setSelectedMethod(newId);
    setShowAddMethod(false);
    setNewMethodAccount("");
  };

  const handleMaxAmount = () => {
    const maxAmount = Math.max(0, availableBalance - 5.0);
    setAmount(maxAmount.toFixed(2));
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
          <Text className="text-[20px] font-heading font-black text-foreground">
            Withdraw Funds
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-32 pt-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Input Card */}
        <View className="bg-white rounded-[32px] p-6 mb-8 border border-surface-100 shadow-sm shadow-surface-200/50 mt-4">
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center bg-brand-50 px-3 py-1.5 rounded-full border border-brand-100">
              <Icon name="info" size={14} color="#004CFF" style={{ marginRight: 6 }} />
              <Text className="text-[12px] font-bold text-brand-700">
                Available: GHS {availableBalance.toFixed(2)}
              </Text>
            </View>
            <Pressable
              onPress={handleMaxAmount}
              className="bg-surface-100 px-3 py-1.5 rounded-full"
            >
              <Text className="text-[12px] font-bold text-surface-700">Withdraw Max</Text>
            </Pressable>
          </View>

          <View className="items-center justify-center py-4">
            <View className="flex-row items-center justify-center">
              <Text className="text-[28px] font-black text-surface-400 mr-2 mt-1">GHS</Text>
              <TextInput
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                className="text-[56px] font-heading font-black text-surface-900 min-w-[120px] text-center"
                placeholderTextColor="#cbd5e1"
                autoFocus
              />
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View className="mb-8">
          <Text className="text-[14px] font-bold text-surface-500 mb-4 ml-2 uppercase tracking-wider">
            Transfer To
          </Text>
          <View className="bg-white rounded-[24px] border border-surface-100 p-2 shadow-sm shadow-surface-200/30">
            {methods.map((method, index) => {
              const isSelected = selectedMethod === method.id;

              return (
                <Pressable
                  key={method.id}
                  onPress={() => setSelectedMethod(method.id)}
                  className={`p-4 rounded-[20px] flex-row items-center ${isSelected ? "bg-brand-50 border border-brand-200" : "bg-transparent border border-transparent"}`}
                  style={
                    !isSelected && index < methods.length - 1
                      ? { borderBottomColor: "#f1f5f9", borderBottomWidth: 1, borderRadius: 0 }
                      : {}
                  }
                >
                  <View
                    className={`w-12 h-12 rounded-[16px] items-center justify-center mr-4 ${isSelected ? "bg-brand-600" : "bg-surface-100"}`}
                  >
                    <Icon name={method.icon} size={24} color={isSelected ? "#fff" : "#64748b"} />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-[16px] font-bold mb-0.5 tracking-tight ${isSelected ? "text-brand-900" : "text-surface-900"}`}
                    >
                      {method.title}
                    </Text>
                    <Text
                      className={`text-[13px] font-body ${isSelected ? "text-brand-600" : "text-surface-500"}`}
                    >
                      {method.account}
                    </Text>
                  </View>
                  <View
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? "border-brand-600 bg-brand-600" : "border-surface-300 bg-transparent"}`}
                  >
                    {isSelected && <Icon name="check" size={12} color="#ffffff" />}
                  </View>
                </Pressable>
              );
            })}

            <Pressable
              className="mt-2 p-4 flex-row items-center justify-center border-t border-dashed border-surface-200"
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              onPress={() => setShowAddMethod(true)}
            >
              <Icon name="plus" size={18} color="#004CFF" style={{ marginRight: 8 }} />
              <Text className="text-[15px] font-bold text-brand-600">Add Payment Method</Text>
            </Pressable>
          </View>
        </View>

        {/* Receipt Summary */}
        <View className="mb-8">
          <Text className="text-[14px] font-bold text-surface-500 mb-4 ml-2 uppercase tracking-wider">
            Summary
          </Text>
          <View className="bg-white rounded-[24px] border border-surface-100 p-6 shadow-sm shadow-surface-200/30">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-[15px] font-body text-surface-600">Amount</Text>
              <Text className="text-[15px] font-bold text-surface-900">
                GHS {numAmount.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-[15px] font-body text-surface-600">Processing Fee</Text>
              <Text className="text-[15px] font-bold text-surface-900">GHS {fee.toFixed(2)}</Text>
            </View>

            <View
              className="h-[2px] bg-surface-200 w-full mb-5"
              style={{ borderStyle: "dashed" }}
            />

            <View className="flex-row justify-between items-center">
              <Text className="text-[16px] font-bold text-surface-900">Total Deduction</Text>
              <Text className="text-[20px] font-heading font-black text-brand-600 tracking-tight">
                GHS {totalDeduction.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-surface-100 px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        <Button
          title={`Withdraw GHS ${numAmount.toFixed(2)}`}
          size="lg"
          loading={withdrawMutation.isPending}
          onPress={handleWithdrawRequest}
          disabled={numAmount <= 0}
          className="w-full shadow-lg shadow-brand-600/20"
        />
      </View>

      {/* Add Payment Method Modal */}
      <Modal
        visible={showAddMethod}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddMethod(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <Pressable className="absolute inset-0" onPress={() => setShowAddMethod(false)} />
          <View
            className="bg-white rounded-t-[32px] p-6 shadow-2xl"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="w-12 h-1.5 bg-surface-200 rounded-full self-center mb-6" />

            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-[22px] font-heading font-black text-surface-900 tracking-tight">
                Add Method
              </Text>
              <Pressable
                onPress={() => setShowAddMethod(false)}
                className="w-8 h-8 bg-surface-100 rounded-full items-center justify-center"
              >
                <Icon name="x" size={16} color="#0f172a" />
              </Pressable>
            </View>

            <View className="flex-row gap-4 mb-8">
              <Pressable
                onPress={() => setNewMethodType("momo")}
                className={`flex-1 p-5 rounded-[20px] border items-center justify-center ${newMethodType === "momo" ? "bg-brand-50 border-brand-300 shadow-sm shadow-brand-200" : "bg-surface-50 border-surface-200"}`}
              >
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${newMethodType === "momo" ? "bg-brand-600" : "bg-white"}`}
                >
                  <Icon
                    name="smartphone"
                    size={24}
                    color={newMethodType === "momo" ? "#fff" : "#64748b"}
                  />
                </View>
                <Text
                  className={`text-[14px] font-bold ${newMethodType === "momo" ? "text-brand-900" : "text-surface-600"}`}
                >
                  Mobile Money
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setNewMethodType("bank")}
                className={`flex-1 p-5 rounded-[20px] border items-center justify-center ${newMethodType === "bank" ? "bg-brand-50 border-brand-300 shadow-sm shadow-brand-200" : "bg-surface-50 border-surface-200"}`}
              >
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center mb-3 ${newMethodType === "bank" ? "bg-brand-600" : "bg-white"}`}
                >
                  <Icon
                    name="briefcase"
                    size={24}
                    color={newMethodType === "bank" ? "#fff" : "#64748b"}
                  />
                </View>
                <Text
                  className={`text-[14px] font-bold ${newMethodType === "bank" ? "text-brand-900" : "text-surface-600"}`}
                >
                  Bank Transfer
                </Text>
              </Pressable>
            </View>

            <View className="mb-8">
              <Text className="text-[14px] font-bold text-surface-900 mb-2 ml-1">
                {newMethodType === "momo" ? "Mobile Number" : "Account Number"}
              </Text>
              <TextInput
                placeholder={
                  newMethodType === "momo" ? "e.g. 024 123 4567" : "Enter account number"
                }
                keyboardType="number-pad"
                value={newMethodAccount}
                onChangeText={setNewMethodAccount}
                className="bg-surface-50 border border-surface-200 rounded-[16px] px-5 h-14 font-body text-[16px] text-surface-900"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <Button title="Save Payment Method" size="lg" onPress={handleAddMethod} />
          </View>
        </View>
      </Modal>

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
              <Text className="text-[24px] font-heading font-black text-surface-900 tracking-tight">
                Enter PIN
              </Text>
              <Pressable
                className="w-10 h-10 bg-surface-100 rounded-full items-center justify-center"
                onPress={() => {
                  setShowPinModal(false);
                  setPin("");
                }}
              >
                <Icon name="x" size={20} color="#0f172a" />
              </Pressable>
            </View>

            <Text className="text-[15px] font-body text-surface-500 text-center mb-10 px-4">
              Enter your 4-digit security PIN to confirm the withdrawal of{" "}
              <Text className="font-bold text-surface-900">GHS {numAmount.toFixed(2)}</Text>.
            </Text>

            {/* PIN Dots */}
            <View className="flex-row justify-center gap-6 mb-16">
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  className={`w-5 h-5 rounded-full border-2 ${pin.length > i ? "bg-brand-600 border-brand-600" : "bg-transparent border-surface-300"}`}
                />
              ))}
            </View>

            {/* iOS-style Keypad */}
            <View className="flex-row flex-wrap justify-between gap-y-8 px-6 max-w-[320px] self-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Pressable
                  key={num}
                  className="w-[28%] aspect-square items-center justify-center rounded-full bg-surface-50 border border-surface-100 shadow-sm shadow-surface-200/50"
                  style={({ pressed }) => [
                    {
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                      backgroundColor: pressed ? "#e2e8f0" : "#f8fafc",
                    },
                  ]}
                  onPress={() => handlePinEntry(num.toString())}
                >
                  <Text className="text-[32px] font-heading font-black text-surface-900">
                    {num}
                  </Text>
                </Pressable>
              ))}
              <View className="w-[28%] aspect-square" />
              <Pressable
                className="w-[28%] aspect-square items-center justify-center rounded-full bg-surface-50 border border-surface-100 shadow-sm shadow-surface-200/50"
                style={({ pressed }) => [
                  {
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    backgroundColor: pressed ? "#e2e8f0" : "#f8fafc",
                  },
                ]}
                onPress={() => handlePinEntry("0")}
              >
                <Text className="text-[32px] font-heading font-black text-surface-900">0</Text>
              </Pressable>
              <Pressable
                className="w-[28%] aspect-square items-center justify-center rounded-full"
                style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
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
