import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, Pressable } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useWallet, useTransfer } from "@/lib/hooks/use-wallet";

const RECENT_CONTACTS = [
  { id: "1", name: "Abena O.", phone: "024 123 4567", initial: "A" },
  { id: "2", name: "Kofi M.", phone: "055 987 6543", initial: "K" },
  { id: "3", name: "Ama B.", phone: "020 456 7890", initial: "A" },
];

export default function TransferScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [pin, setPin] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: walletData } = useWallet();
  const transferMutation = useTransfer();
  const balance = walletData?.balance ?? 0;

  const handleTransfer = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || !recipient) return;

    if (numAmount > balance) {
      Alert.alert("Insufficient Funds", "You do not have enough balance to make this transfer.");
      return;
    }

    setShowPinModal(true);
  };

  const confirmTransfer = async () => {
    if (!pin) return;
    setIsProcessing(true);
    setShowPinModal(false);
    try {
      await transferMutation.mutateAsync({ email: recipient, amount: parseFloat(amount), pin });
      setIsSuccess(true);
    } catch (error: any) {
      Alert.alert("Transfer Failed", error?.response?.data?.message || error?.message || "Something went wrong");
    } finally {
      setIsProcessing(false);
      setPin("");
    }
  };

  if (isSuccess) {
    return (
      <View className="flex-1 bg-brand-600 justify-center items-center px-5" style={{ paddingTop: insets.top }}>
        <View className="w-20 h-20 bg-card rounded-full items-center justify-center mb-6">
          <Icon name="check" size={40} color="#10b981" />
        </View>
        <Text className="text-[32px] font-black text-white font-heading text-center mb-2">
          Transfer Sent!
        </Text>
        <Text className="text-[16px] text-white/80 font-body text-center mb-10 px-4">
          GHS {parseFloat(amount || "0").toFixed(2)} has been successfully sent to {recipient}.
        </Text>
        <Button
          title="Back to Wallet"
          variant="outline"
          className="w-full bg-card/10 border-card/20"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  const numAmount = parseFloat(amount || "0") || 0;
  const isInsufficient = numAmount > balance;
  const isValidAmount = numAmount > 0 && !isInsufficient;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-card"
    >
      <View
        className="px-5 pb-4 bg-card"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row items-center justify-between">
          <BackButton />
          <View className="bg-background px-3 py-1.5 rounded-full flex-row items-center">
            <Text className="text-[12px] font-bold text-muted-foreground mr-1">Balance:</Text>
            <Text className="text-[14px] font-bold text-brand-600">GHS {balance.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      >
        <Text className="text-[14px] font-bold text-muted-foreground font-heading mb-2 ml-1 mt-4">Send Amount</Text>
        <View className={`bg-background p-4 rounded-[20px] mb-2 flex-row items-center border ${isInsufficient ? "border-red-500" : "border-border"}`}>
          <Text className="text-[20px] font-bold text-foreground mr-2">GHS</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor="#cbd5e1"
            maxLength={6}
            className="flex-1 text-[32px] font-black text-foreground font-heading p-0 m-0"
          />
        </View>
        {isInsufficient ? (
          <Text className="text-red-500 font-bold text-sm ml-2 mb-6">Insufficient balance</Text>
        ) : (
          <View className="mb-6" />
        )}

        <Text className="text-[14px] font-bold text-muted-foreground font-heading mb-2 ml-1">Send To</Text>
        <View className="mb-8">
          <Input
            placeholder="Phone number, username, or email"
            value={recipient}
            onChangeText={setRecipient}
            leftIcon={<Icon name="user" size={18} color="#64748b" />}
            className="bg-background border-0"
          />
        </View>

        <Text className="text-[16px] font-bold text-foreground font-heading mb-4 px-1">Recent Contacts</Text>
        <View className="bg-background rounded-[20px] overflow-hidden mb-8">
          {RECENT_CONTACTS.map((contact, idx) => {
            const isSelected = recipient === contact.phone;
            const isLast = idx === RECENT_CONTACTS.length - 1;
            return (
              <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                key={contact.id}
                onPress={() => setRecipient(contact.phone)}
                className={`flex-row items-center p-4 ${!isLast ? "border-b border-border" : ""}`}
              >
                <View className="w-10 h-10 rounded-full bg-brand-100 items-center justify-center mr-4">
                  <Text className="font-bold text-[16px] text-brand-600 font-heading">{contact.initial}</Text>
                </View>
                <View className="flex-1">
                  <Text className={`text-[15px] font-bold ${isSelected ? "text-brand-700" : "text-foreground"}`}>{contact.name}</Text>
                  <Text className="text-[13px] text-muted-foreground mt-0.5">{contact.phone}</Text>
                </View>
                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${isSelected ? "border-brand-500 bg-brand-500" : "border-surface-300 bg-transparent"}`}>
                  {isSelected && <Icon name="check" size={10} color="#fff" />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-5 py-4 bg-card border-t border-border">
        <Button
          title={isProcessing ? "Processing..." : `Send GHS ${amount || "0"}`}
          size="lg"
          disabled={!isValidAmount || !recipient || isProcessing}
          className="w-full rounded-[16px]"
          onPress={handleTransfer}
        />
      </View>

      {showPinModal && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center z-50" style={{ paddingTop: insets.top }}>
          <View className="bg-card mx-5 p-6 rounded-[24px] w-[90%] max-w-[340px]">
            <Text className="text-[18px] font-heading font-black text-foreground text-center mb-2">Enter PIN</Text>
            <Text className="text-[13px] text-muted-foreground font-body text-center mb-6">
              Enter your wallet PIN to confirm this transfer
            </Text>

            <View className="flex-row justify-center gap-4 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  className={`w-5 h-5 rounded-full border-2 ${pin.length > i ? "bg-brand-600 border-brand-600" : "bg-transparent border-surface-300"}`}
                />
              ))}
            </View>

            <View className="flex-row flex-wrap justify-center gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "del"].map((key, i) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    if (key === "del") { setPin((p) => p.slice(0, -1)); return; }
                    if (typeof key === "number") { setPin((p) => p.length < 4 ? p + key : p); }
                  }}
                  className={`w-16 h-16 rounded-full items-center justify-center ${typeof key === "number" ? "bg-background" : "bg-transparent"}`}
                >
                  {key === "del" ? (
                    <Icon name="delete" size={24} color="#ef4444" />
                  ) : key === "" ? null : (
                    <Text className="text-[24px] font-bold text-foreground">{key}</Text>
                  )}
                </Pressable>
              ))}
            </View>

            <View className="flex-row gap-3">
              <Button
                title="Cancel"
                variant="outline"
                className="flex-1"
                onPress={() => { setShowPinModal(false); setPin(""); }}
              />
              <Button
                title="Confirm"
                className="flex-1"
                disabled={pin.length < 4}
                onPress={confirmTransfer}
              />
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
