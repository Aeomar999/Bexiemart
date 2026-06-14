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
import { useState, useEffect, useCallback } from "react";
import { useLinkBankAccount } from "@/lib/hooks/use-wallet";
import { walletApi } from "@/lib/api/wallet";

const GHANA_BANKS = [
  { code: "GH010100", name: "Bank of Ghana" },
  { code: "GH030100", name: "GCB Bank" },
  { code: "GH040100", name: "National Investment Bank" },
  { code: "GH050100", name: "Agricultural Development Bank" },
  { code: "GH060100", name: "CalBank" },
  { code: "GH070100", name: "Ecobank Ghana" },
  { code: "GH080100", name: "Fidelity Bank" },
  { code: "GH090100", name: "First Atlantic Bank" },
  { code: "GH100100", name: "First National Bank Ghana" },
  { code: "GH110100", name: "Guaranty Trust Bank Ghana" },
  { code: "GH120100", name: "Republic Bank Ghana" },
  { code: "GH130100", name: "Societe Generale Ghana" },
  { code: "GH140100", name: "Stanbic Bank Ghana" },
  { code: "GH150100", name: "Standard Chartered Bank Ghana" },
  { code: "GH160100", name: "United Bank for Africa Ghana" },
  { code: "GH170100", name: "Zenith Bank Ghana" },
  { code: "GH180100", name: "Access Bank Ghana" },
  { code: "GH190100", name: "Absa Bank Ghana" },
  { code: "GH200100", name: "Prudential Bank" },
  { code: "GH210100", name: "OmniBSIC Bank" },
];

export default function AddBankAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const linkBankAccount = useLinkBankAccount();

  const [selectedBank, setSelectedBank] = useState<{ code: string; name: string } | null>(null);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedName, setResolvedName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");

  const resolveAccount = useCallback(async () => {
    if (!selectedBank || accountNumber.length < 8) return;

    setResolving(true);
    setResolvedName("");
    setResolveError("");

    try {
      const response = await walletApi.resolveAccount(selectedBank.code, accountNumber);
      setResolvedName(response.data.accountName);
    } catch (error: any) {
      const serverMessage = error.response?.data?.message;
      setResolveError(
        typeof serverMessage === "string"
          ? serverMessage
          : "Could not resolve account. Please check your details."
      );
    } finally {
      setResolving(false);
    }
  }, [selectedBank, accountNumber]);

  useEffect(() => {
    if (selectedBank && accountNumber.length >= 10) {
      const timer = setTimeout(resolveAccount, 800);
      return () => clearTimeout(timer);
    } else {
      setResolvedName("");
      setResolveError("");
    }
  }, [selectedBank, accountNumber, resolveAccount]);

  const handleSubmit = () => {
    if (!selectedBank || !accountNumber || !resolvedName) {
      Alert.alert("Error", "Please fill all fields and verify your account number.");
      return;
    }

    linkBankAccount.mutate(
      {
        bankCode: selectedBank.code,
        accountNumber,
        accountName: resolvedName,
        bankName: selectedBank.name,
      },
      {
        onSuccess: () => {
          router.back();
        },
        onError: (err: any) => {
          const serverMessage = err.response?.data?.message;
          const msg = Array.isArray(serverMessage) ? serverMessage.join(", ") : serverMessage;
          Alert.alert("Error", msg || err?.message || "Failed to link bank account");
        },
      }
    );
  };

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
          <Text className="text-[20px] font-heading font-black text-foreground">
            Add Bank Account
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Info Banner */}
        <View className="mx-5 mb-6 bg-blue-50 rounded-2xl p-4 flex-row items-start">
          <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3 mt-0.5">
            <Icon name="shield" size={16} color="#2563EB" />
          </View>
          <View className="flex-1">
            <Text className="text-blue-900 font-bold text-sm mb-0.5">Secure & Verified</Text>
            <Text className="text-blue-700 text-xs leading-[18px]">
              Your bank account is verified through Paystack. We never store your bank credentials.
            </Text>
          </View>
        </View>

        <View className="px-5">
          <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
            {/* Bank Selector */}
            <View className="mb-5">
              <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                Select Bank
              </Text>
              <Pressable
                onPress={() => setShowBankPicker(!showBankPicker)}
                className="bg-gray-50 flex-row items-center justify-between rounded-2xl px-4 py-4 border border-gray-200"
              >
                <View className="flex-row items-center">
                  <Icon name="building" size={18} color="#9ca3af" />
                  <Text
                    className={`ml-3 font-medium ${selectedBank ? "text-gray-900" : "text-gray-400"}`}
                  >
                    {selectedBank ? selectedBank.name : "Choose your bank"}
                  </Text>
                </View>
                <Icon
                  name={showBankPicker ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#9ca3af"
                />
              </Pressable>

              {/* Bank Dropdown */}
              {showBankPicker && (
                <View className="bg-white rounded-2xl border border-gray-200 mt-2 max-h-[250px] overflow-hidden">
                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
                    {GHANA_BANKS.map((bank) => (
                      <Pressable
                        key={bank.code}
                        onPress={() => {
                          setSelectedBank(bank);
                          setShowBankPicker(false);
                        }}
                        className={`px-4 py-3.5 border-b border-gray-50 ${selectedBank?.code === bank.code ? "bg-blue-50" : "active:bg-gray-50"}`}
                      >
                        <View className="flex-row items-center">
                          <View
                            className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${selectedBank?.code === bank.code ? "bg-blue-100" : "bg-gray-100"}`}
                          >
                            <Icon
                              name="building"
                              size={14}
                              color={selectedBank?.code === bank.code ? "#2563EB" : "#9ca3af"}
                            />
                          </View>
                          <Text
                            className={`font-medium text-[14px] ${selectedBank?.code === bank.code ? "text-blue-600" : "text-gray-700"}`}
                          >
                            {bank.name}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Account Number */}
            <View className="mb-5">
              <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
                Account Number
              </Text>
              <View className="bg-gray-50 flex-row items-center rounded-2xl px-4 border border-gray-200">
                <Icon name="hash" size={18} color="#9ca3af" />
                <TextInput
                  className="flex-1 py-4 px-3 text-gray-900 font-medium font-mono"
                  placeholder="Enter account number"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                  maxLength={16}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                />
                {resolving && <ActivityIndicator size="small" color="#2563EB" />}
              </View>
            </View>

            {/* Resolved Account Name */}
            {resolvedName ? (
              <View className="mb-5 bg-green-50 rounded-2xl p-4 flex-row items-center border border-green-100">
                <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Icon name="check-circle" size={20} color="#059669" />
                </View>
                <View className="flex-1">
                  <Text className="text-green-800 text-xs font-bold uppercase tracking-wider mb-0.5">
                    Account Verified
                  </Text>
                  <Text className="text-success font-bold text-[15px]">{resolvedName}</Text>
                </View>
              </View>
            ) : resolveError ? (
              <View className="mb-5 bg-red-50 rounded-2xl p-4 flex-row items-center border border-red-100">
                <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                  <Icon name="x-circle" size={20} color="#DC2626" />
                </View>
                <View className="flex-1">
                  <Text className="text-red-700 text-sm">{resolveError}</Text>
                </View>
              </View>
            ) : null}

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={linkBankAccount.isPending || !resolvedName}
              className={`w-full rounded-2xl py-4 flex-row justify-center items-center ${
                !resolvedName || linkBankAccount.isPending ? "bg-gray-300" : "bg-blue-600"
              }`}
              style={
                resolvedName
                  ? {
                      shadowColor: "#2563EB",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 5,
                    }
                  : {}
              }
            >
              {linkBankAccount.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="link" size={18} color="#fff" />
                  <Text className="text-white font-bold text-base ml-2 tracking-wide">
                    Link Bank Account
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
