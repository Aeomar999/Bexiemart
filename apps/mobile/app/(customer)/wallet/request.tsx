import { BackButton } from "@/components/ui/BackButton";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/lib/hooks/use-wallet";
import Toast from "@/lib/toast-polyfill";

export default function RequestMoneyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: wallet } = useWallet();
  const [amount, setAmount] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");

  const handleRequest = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || !contact) return;

    Toast.show({
      type: "success",
      text1: "Request Sent!",
      text2: `You requested GHS ${numAmount.toFixed(2)} from ${contact}.`,
    });
    router.back();
  };

  const numAmount = parseFloat(amount || "0") || 0;
  const isValidAmount = numAmount > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-[20px] font-heading font-black text-foreground">Request Money</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      >
        <Text className="text-[14px] font-bold text-muted-foreground font-heading mb-2 ml-1 mt-4">
          Request Amount
        </Text>
        <View className="bg-background p-4 rounded-[20px] mb-8 flex-row items-center">
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

        <View className="bg-emerald-50/50 p-5 rounded-[20px] mb-8 border border-emerald-100">
          <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mb-3">
            <Icon name="arrow-down-left" size={20} color="#059669" />
          </View>
          <Text className="text-[14px] text-muted-foreground font-body leading-[22px]">
            Ask friends, family, or customers for money. They will receive a notification and a
            secure link to pay.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-[14px] font-bold text-muted-foreground font-heading mb-2 ml-1">
            Request From
          </Text>
          <Input
            placeholder="Phone Number or Username"
            value={contact}
            onChangeText={setContact}
            leftIcon={<Icon name="user" size={18} color="#64748b" />}
            className="bg-background border-0"
          />
        </View>

        <View className="mb-6">
          <Text className="text-[14px] font-bold text-muted-foreground font-heading mb-2 ml-1">
            Note (Optional)
          </Text>
          <Input
            placeholder="What's this for?"
            value={note}
            onChangeText={setNote}
            leftIcon={<Icon name="file-text" size={18} color="#64748b" />}
            className="bg-background border-0"
          />
        </View>
      </ScrollView>

      <View className="px-5 py-4 bg-card border-t border-border">
        <Button
          title={`Request GHS ${amount || "0"}`}
          size="lg"
          disabled={!isValidAmount || !contact}
          className="w-full rounded-[16px]"
          onPress={handleRequest}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
