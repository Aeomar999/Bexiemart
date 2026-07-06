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
import { useLinkMomoAccount } from "@/lib/hooks/use-wallet";
import { LinearGradient } from "expo-linear-gradient";

const PROVIDERS = [
  {
    id: "MTN",
    name: "MTN Mobile Money",
    shortName: "MTN MoMo",
    gradient: ["#FFC107", "#FF9800"] as const,
    textColor: "#000",
    description: "Ghana's most popular mobile money service",
  },
  {
    id: "VODAFONE",
    name: "Vodafone Cash",
    shortName: "Vodafone Cash",
    gradient: ["#E60000", "#B71C1C"] as const,
    textColor: "#fff",
    description: "Fast and reliable mobile payments",
  },
  {
    id: "AIRTELTIGO",
    name: "AirtelTigo Money",
    shortName: "AT Money",
    gradient: ["#0073CF", "#01579B"] as const,
    textColor: "#fff",
    description: "Simple mobile money for everyone",
  },
];

export default function AddMomoAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const linkMomoAccount = useLinkMomoAccount();

  const [selectedProvider, setSelectedProvider] = useState<(typeof PROVIDERS)[number] | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const handleSubmit = () => {
    if (!selectedProvider) {
      Alert.alert("Error", "Please select a provider.");
      return;
    }
    if (phoneNumber.length < 10) {
      Alert.alert("Error", "Please enter a valid phone number.");
      return;
    }
    if (!accountName.trim()) {
      Alert.alert("Error", "Please enter the account holder name.");
      return;
    }

    linkMomoAccount.mutate(
      {
        provider: selectedProvider.id,
        phoneNumber,
        accountName: accountName.trim(),
      },
      {
        onSuccess: () => {
          router.back();
        },
        onError: (err: any) => {
          const serverMessage = err.response?.data?.message;
          const msg = Array.isArray(serverMessage) ? serverMessage.join(", ") : serverMessage;
          Alert.alert("Error", msg || err?.message || "Failed to link mobile money account");
        },
      }
    );
  };

  const isValid = selectedProvider && phoneNumber.length >= 10 && accountName.trim().length > 0;

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
            Add Mobile Money
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Provider Selector */}
        <View className="px-5 mb-6">
          <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3 ml-1">
            Select Provider
          </Text>
          {PROVIDERS.map((provider) => {
            const isSelected = selectedProvider?.id === provider.id;
            return (
              <Pressable
                key={provider.id}
                onPress={() => setSelectedProvider(provider)}
                className="mb-3"
              >
                <View
                  className="rounded-2xl overflow-hidden"
                  style={
                    isSelected
                      ? { borderWidth: 3, borderColor: provider.gradient[0] }
                      : { borderWidth: 1, borderColor: "#e5e7eb" }
                  }
                >
                  <LinearGradient
                    colors={isSelected ? (provider.gradient as any) : ["#fff", "#fafafa"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ padding: 16, flexDirection: "row", alignItems: "center" }}
                  >
                    <View
                      className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 ${isSelected ? "bg-white/25" : "bg-gray-100"}`}
                    >
                      <Icon
                        name="smartphone"
                        size={24}
                        color={isSelected ? provider.textColor : "#6b7280"}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`font-bold text-body-lg ${isSelected ? `text-[${provider.textColor}]` : "text-gray-900"}`}
                        style={isSelected ? { color: provider.textColor } : {}}
                      >
                        {provider.name}
                      </Text>
                      <Text
                        className={`text-sm mt-0.5 ${isSelected ? "opacity-70" : "text-gray-500"}`}
                        style={isSelected ? { color: provider.textColor } : {}}
                      >
                        {provider.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <View className="w-8 h-8 rounded-full bg-white/30 items-center justify-center">
                        <Icon name="check" size={18} color={provider.textColor} />
                      </View>
                    )}
                  </LinearGradient>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Form */}
        <View className="px-5">
          <View className="bg-white rounded-3xl p-5 border border-gray-100">
            {/* Phone Number */}
            <View className="mb-5">
              <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                Phone Number
              </Text>
              <View className="bg-gray-50 flex-row items-center rounded-2xl px-4 border border-gray-200">
                <Icon name="phone" size={18} color="#9ca3af" />
                <TextInput
                  className="flex-1 py-4 px-3 text-gray-900 font-medium font-mono"
                  placeholder="e.g. 0241234567"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>
            </View>

            {/* Account Name */}
            <View className="mb-6">
              <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                Account Name
              </Text>
              <View className="bg-gray-50 flex-row items-center rounded-2xl px-4 border border-gray-200">
                <Icon name="user" size={18} color="#9ca3af" />
                <TextInput
                  className="flex-1 py-4 px-3 text-gray-900 font-medium"
                  placeholder="e.g. Kofi Mensah"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                  value={accountName}
                  onChangeText={setAccountName}
                />
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={linkMomoAccount.isPending || !isValid}
              className={`w-full rounded-2xl py-4 flex-row justify-center items-center ${
                !isValid || linkMomoAccount.isPending ? "bg-gray-300" : ""
              }`}
              style={
                isValid && !linkMomoAccount.isPending
                  ? {
                      backgroundColor: selectedProvider?.gradient[0] || "#2563EB",
                    }
                  : {}
              }
            >
              {linkMomoAccount.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon
                    name="link"
                    size={18}
                    color={isValid ? selectedProvider?.textColor || "#fff" : "#fff"}
                  />
                  <Text
                    className="font-bold text-base ml-2 tracking-wide"
                    style={{ color: isValid ? selectedProvider?.textColor || "#fff" : "#fff" }}
                  >
                    Link {selectedProvider?.shortName || "Mobile Money"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
