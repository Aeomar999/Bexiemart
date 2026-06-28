import { BackButton } from "@/components/ui/BackButton";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useState } from "react";
import { useVerifyAndSaveCard, WALLET_KEYS } from "@/lib/hooks/use-wallet";
import { getCardColors } from "@/lib/utils/wallet";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { usePaystack } from "react-native-paystack-webview";
import { useAuthStore } from "@/lib/stores/auth-store";

// Helper to format card number
const formatCardNumber = (value: string) => {
  const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
  const matches = v.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || "";
  const parts = [];

  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }

  if (parts.length) {
    return parts.join(" ");
  } else {
    return value;
  }
};

export default function AddCardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addCard = useVerifyAndSaveCard();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const paystack = usePaystack();

  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const handleAdd = () => {
    if (!name) {
      Alert.alert("Error", "Please enter the cardholder name.");
      return;
    }

    paystack.popup.newTransaction({
      amount: 1,
      billingEmail: user?.email || "customer@bexiemart.com",
      billingName: name || user?.name || "Customer",
      channels: ["card"],
      currency: "GHS",
      onSuccess: (res: any) => {
        const reference =
          res.data?.transactionRef?.reference || res.transactionRef?.reference || res.reference;
        addCard.mutate(
          {
            reference,
            cardholderName: name || user?.name || "Customer",
            isDefault,
          },
          {
            onSuccess: () => {
              router.back();
            },
            onError: (err: any) => {
              Alert.alert("Verification Error", err?.message || "Failed to save card");
            },
          }
        );
      },
      onCancel: () => {
        // User cancelled the flow
      },
    } as any);
  };

  const cardType = number.startsWith("4") ? "VISA" : number.startsWith("5") ? "MASTERCARD" : "CARD";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-display-sm font-heading font-black text-foreground">
            Add New Card
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Dynamic Card Preview */}
        <View className="px-5 mb-8 mt-2">
          <View
            style={{
              height: 200,
              width: "100%",
              elevation: 15,
              shadowColor: "#4f2ae8",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
            }}
          >
            <LinearGradient
              colors={getCardColors(undefined, cardType)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flex: 1,
                borderRadius: 24,
                padding: 24,
                justifyContent: "space-between",
                overflow: "hidden",
              }}
            >
              {/* Abstract decorative elements */}
              <View className="absolute top-[-50px] right-[-30px] w-[150px] h-[150px] rounded-full bg-white/5" />
              <View className="absolute bottom-[-80px] left-[-20px] w-[200px] h-[200px] rounded-full bg-white/5" />

              <View className="flex-row justify-between items-start">
                <Icon name="credit-card" size={28} color="rgba(255,255,255,0.8)" />
                <View className="flex-row items-center">
                  {cardType === "VISA" && (
                    <View style={{ transform: [{ rotate: "90deg" }], marginRight: 8 }}>
                      <Icon name="wifi" size={16} color="rgba(255,255,255,0.7)" />
                    </View>
                  )}
                  <Text className="text-white text-display-sm font-black italic tracking-widest">
                    {cardType}
                  </Text>
                </View>
              </View>

              <View>
                <Text className="text-white/80 text-display-sm font-mono tracking-[0.15em] mb-4">
                  {number || "•••• •••• •••• ••••"}
                </Text>

                <View className="flex-row justify-between items-end">
                  <View>
                    <Text className="text-white/50 text-caption font-bold uppercase tracking-widest mb-1">
                      Cardholder Name
                    </Text>
                    <Text
                      className="text-white text-body-lg font-bold tracking-wide"
                      numberOfLines={1}
                    >
                      {name ? name.toUpperCase() : "YOUR NAME"}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-white/50 text-caption font-bold uppercase tracking-widest mb-1">
                      Expiry
                    </Text>
                    <Text className="text-white text-body-md font-bold tracking-wide">
                      {expiry || "MM/YY"}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        <View className="px-5">
          <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            <View className="mb-5">
              <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                Cardholder Name
              </Text>
              <View className="bg-gray-50 flex-row items-center rounded-2xl px-4 border border-gray-200">
                <Icon name="user" size={18} color="#9ca3af" />
                <TextInput
                  className="flex-1 py-4 px-3 text-gray-900 font-medium"
                  placeholder="e.g. John Doe"
                  placeholderTextColor="#9ca3af"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View className="mb-5">
              <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                Card Number
              </Text>
              <View className="bg-gray-50 flex-row items-center rounded-2xl px-4 border border-gray-200">
                <Icon name="credit-card" size={18} color="#9ca3af" />
                <TextInput
                  className="flex-1 py-4 px-3 text-gray-900 font-medium font-mono"
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                  maxLength={19}
                  value={number}
                  onChangeText={(text) => setNumber(formatCardNumber(text))}
                />
              </View>
            </View>

            <View className="flex-row gap-4 mb-6">
              <View className="flex-1">
                <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                  Expiry Date
                </Text>
                <View className="bg-gray-50 flex-row items-center rounded-2xl px-4 border border-gray-200">
                  <Icon name="calendar" size={18} color="#9ca3af" />
                  <TextInput
                    className="flex-1 py-4 px-3 text-gray-900 font-medium font-mono"
                    placeholder="MM/YY"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                    maxLength={5}
                    value={expiry}
                    onChangeText={(text) => {
                      if (text.length === 2 && !text.includes("/") && expiry.length === 1) {
                        setExpiry(text + "/");
                      } else {
                        setExpiry(text);
                      }
                    }}
                  />
                </View>
              </View>

              <View className="flex-1">
                <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                  CVV
                </Text>
                <View className="bg-gray-50 flex-row items-center rounded-2xl px-4 border border-gray-200">
                  <Icon name="lock" size={18} color="#9ca3af" />
                  <TextInput
                    className="flex-1 py-4 px-3 text-gray-900 font-medium font-mono"
                    placeholder="123"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={4}
                    value={cvv}
                    onChangeText={setCvv}
                  />
                </View>
              </View>
            </View>

            <Pressable
              onPress={() => setIsDefault(!isDefault)}
              className="flex-row items-center mb-6 pl-1"
            >
              <View
                className={`w-6 h-6 rounded-md items-center justify-center border mr-3 ${isDefault ? "bg-primary border-primary" : "border-gray-300 bg-gray-50"}`}
              >
                {isDefault && <Icon name="check" size={14} color="#fff" />}
              </View>
              <Text className="text-gray-700 font-medium">Set as default card</Text>
            </Pressable>

            <Pressable
              onPress={handleAdd}
              disabled={addCard.isPending}
              className={`w-full rounded-2xl py-4 flex-row justify-center items-center ${addCard.isPending ? "bg-primary-subtle" : "bg-primary"}`}
              style={{
                shadowColor: "#4f2ae8",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              {addCard.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="shield" size={18} color="#fff" />
                  <Text className="text-white font-bold text-base ml-2 tracking-wide">
                    Securely Add Card
                  </Text>
                </>
              )}
            </Pressable>
            <Text className="text-center text-gray-400 text-xs mt-4">
              Your card data is securely captured by Paystack.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
