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
import Toast from "@/lib/toast-polyfill";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { formatMoney } from "@/lib/money";

export default function RequestMoneyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState(0);
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");

  const handleRequest = () => {
    const numAmount = amount;
    if (!numAmount || !contact) return;

    Toast.show({
      type: "success",
      text1: "Request Sent!",
      text2: `You requested ${formatMoney(numAmount)} from ${contact}.`,
    });
    router.back();
  };

  const numAmount = amount;
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
          <Text className="text-display-sm font-heading font-black text-foreground">
            Request Money
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      >
        <MoneyInput label="Request Amount" value={amount} onChangeValue={setAmount} size="lg" />
        <View className="mb-8" />

        <View className="bg-emerald-50/50 p-5 rounded-2xl mb-8 border border-emerald-100">
          <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mb-3">
            <Icon name="arrow-down-left" size={20} color="#059669" />
          </View>
          <Text className="text-body-md text-muted-foreground font-body leading-[22px]">
            Ask friends, family, or customers for money. They will receive a notification and a
            secure link to pay.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-body-md font-bold text-muted-foreground font-heading mb-2 ml-1">
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
          <Text className="text-body-md font-bold text-muted-foreground font-heading mb-2 ml-1">
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
          title={`Request ${formatMoney(amount)}`}
          size="lg"
          disabled={!isValidAmount || !contact}
          className="w-full rounded-xl"
          onPress={handleRequest}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
