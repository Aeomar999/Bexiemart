import { tokens } from "@/theme/tokens";
import { BackButton } from "@/components/ui/BackButton";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useState } from "react";
import Toast from "@/lib/toast-polyfill";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import {
  useInitializePayment,
  usePaymentMethods,
  useAddPaymentMethod,
  useRemovePaymentMethod,
  useSetDefaultPaymentMethod,
} from "@/lib/hooks/use-payments";
import { useWallet } from "@/lib/hooks/use-wallet";

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: paymentMethodsData } = usePaymentMethods();
  const paymentMethods = paymentMethodsData ?? [];
  const addPaymentMethod = useAddPaymentMethod();
  const removePaymentMethod = useRemovePaymentMethod();
  const setDefaultPaymentMethod = useSetDefaultPaymentMethod();
  const {} = useWallet();
  const initializePayment = useInitializePayment();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    type: "card" as "card" | "momo",
    provider: "visa" as "visa" | "mastercard" | "mtn" | "telecel" | "airteltigo",
    details: "",
    holderName: "",
    expiry: "",
  });

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "visa":
      case "mastercard":
        return "credit-card";
      case "mtn":
      case "telecel":
      case "airteltigo":
        return "smartphone";
      default:
        return "credit-card";
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "visa":
        return "#1a1f71";
      case "mastercard":
        return "#eb001b";
      case "mtn":
        return "#fbbf24";
      case "telecel":
        return "#e11d48";
      case "airteltigo":
        return "#2563eb";
      default:
        return "#64748b";
    }
  };

  const handleSetDefault = (id: string) => {
    setDefaultPaymentMethod.mutate(id, {
      onSuccess: () => {
        Toast.show({
          type: "success",
          text1: "Default Updated",
          text2: "Your default payment method has been set.",
        });
      },
    });
  };

  const handleSave = () => {
    if (
      !formData.details ||
      !formData.holderName ||
      (formData.type === "card" && !formData.expiry)
    ) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please fill out all required fields.",
      });
      return;
    }

    addPaymentMethod.mutate(
      { ...formData, isDefault: false },
      {
        onSuccess: () => {
          Toast.show({
            type: "success",
            text1: "Method Added",
            text2: "Your new payment method has been added.",
          });
          setIsModalVisible(false);
        },
      }
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row justify-between items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-display-sm font-heading font-black text-foreground">
            Payment Methods
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add payment method"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          className="w-10 h-10 rounded-full bg-primary-subtle items-center justify-center border border-border"
          onPress={() => {
            setFormData({
              type: "card",
              provider: "visa",
              details: "",
              holderName: "",
              expiry: "",
            });
            setIsModalVisible(true);
          }}
        >
          <Icon name="plus" size={20} color={tokens.primary} />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-10" showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {paymentMethods.map((method: any) => (
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              key={method.id}
              className={`bg-card rounded-2xl p-5 border ${method.isDefault ? "border-primary bg-primary-subtle/20" : "border-border"}`}
              onPress={() => handleSetDefault(method.id)}
            >
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-row items-center gap-3">
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center"
                    style={{ backgroundColor: getProviderColor(method.provider) + "15" }}
                  >
                    <Icon
                      name={getProviderIcon(method.provider)}
                      size={20}
                      color={getProviderColor(method.provider)}
                    />
                  </View>
                  <View>
                    <Text className="text-body-lg font-heading font-bold text-foreground capitalize">
                      {method.provider} {method.type === "card" ? "Card" : "MoMo"}
                    </Text>
                    <Text className="text-sm text-muted-foreground font-body mt-0.5">
                      {method.details}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  {method.isDefault && (
                    <View className="bg-primary px-2 py-0.5 rounded-md justify-center">
                      <Text className="text-caption font-bold text-white uppercase tracking-wider">
                        Default
                      </Text>
                    </View>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Delete payment method"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={(e) => {
                      e.stopPropagation();
                      removePaymentMethod.mutate(method.id, {
                        onSuccess: () =>
                          Toast.show({
                            type: "info",
                            text1: "Removed",
                            text2: "Payment method deleted.",
                          }),
                      });
                    }}
                    className="w-6 h-6 items-center justify-center bg-rose-50 rounded-full border border-rose-100"
                  >
                    <Icon name="trash-2" size={12} color="#ef4444" />
                  </Pressable>
                </View>
              </View>

              <View className="flex-row justify-between items-center bg-background p-3 rounded-xl border border-border">
                <View>
                  <Text className="text-caption text-muted-foreground font-body uppercase tracking-wider mb-0.5">
                    Cardholder
                  </Text>
                  <Text className="text-body-md font-bold text-foreground font-body">
                    {method.holderName}
                  </Text>
                </View>
                {method.expiry && (
                  <View className="items-end">
                    <Text className="text-caption text-muted-foreground font-body uppercase tracking-wider mb-0.5">
                      Expires
                    </Text>
                    <Text className="text-body-md font-bold text-foreground font-body">
                      {method.expiry}
                    </Text>
                  </View>
                )}
              </View>

              {!method.isDefault && (
                <View className="flex-row gap-3 pt-4 mt-2 border-t border-border">
                  <Pressable
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    className="flex-1 items-center py-1"
                    onPress={(e) => {
                      e.stopPropagation();
                      handleSetDefault(method.id);
                    }}
                  >
                    <Text className="text-sm font-bold text-muted-foreground font-heading">
                      Set as Default
                    </Text>
                  </Pressable>
                </View>
              )}
            </Pressable>
          ))}
          {paymentMethods.length === 0 && (
            <View className="py-10 items-center">
              <Text className="text-muted-foreground font-body">
                No payment methods found. Add one above.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Payment Method Form Modal Overlay */}
      {isModalVisible && (
        <View
          className="absolute inset-0 z-50 flex-1 justify-end bg-black/50"
          style={{ zIndex: 100 }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 justify-end"
          >
            <View
              className="bg-card rounded-t-3xl p-6 pb-10"
              style={{ paddingBottom: Math.max(insets.bottom, 24) }}
            >
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-display-sm font-heading font-bold text-foreground">
                  Add Payment Method
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => setIsModalVisible(false)}
                  className="w-8 h-8 rounded-full bg-muted items-center justify-center"
                >
                  <Icon name="x" size={16} color="#64748b" />
                </Pressable>
              </View>

              <ScrollView className="mb-4" showsVerticalScrollIndicator={false}>
                {/* Method Type Selection */}
                <View className="flex-row gap-3 mb-4">
                  {[
                    { type: "card", label: "Credit/Debit Card", icon: "credit-card" },
                    { type: "momo", label: "Mobile Money", icon: "smartphone" },
                  ].map((opt) => (
                    <Pressable
                      key={opt.type}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          type: opt.type as "card" | "momo",
                          provider: opt.type === "card" ? "visa" : "mtn",
                        })
                      }
                      className={`flex-1 py-3 items-center rounded-xl border ${formData.type === opt.type ? "border-primary bg-primary-subtle" : "border-border bg-card"}`}
                    >
                      <Icon
                        name={opt.icon}
                        size={18}
                        color={formData.type === opt.type ? tokens.primary : "#64748b"}
                      />
                      <Text
                        className={`text-body-sm mt-1 font-bold ${formData.type === opt.type ? "text-primary-hover" : "text-muted-foreground"}`}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Provider Selection */}
                <Text className="text-sm font-bold text-muted-foreground mb-2 ml-1">
                  Select Provider
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {(formData.type === "card"
                    ? ["visa", "mastercard"]
                    : ["mtn", "telecel", "airteltigo"]
                  ).map((prov) => (
                    <Pressable
                      key={prov}
                      onPress={() => setFormData({ ...formData, provider: prov as any })}
                      className={`px-4 py-2 rounded-full border ${formData.provider === prov ? "border-primary bg-primary-subtle" : "border-border bg-card"}`}
                    >
                      <Text
                        className={`text-sm font-bold capitalize ${formData.provider === prov ? "text-primary-hover" : "text-muted-foreground"}`}
                      >
                        {prov}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Inputs */}
                <View className="gap-4">
                  <View>
                    <Text className="text-sm font-bold text-muted-foreground mb-1.5 ml-1">
                      {formData.type === "card" ? "Cardholder Name" : "Account Name"}
                    </Text>
                    <TextInput
                      className="bg-background border border-border rounded-2xl px-4 py-3.5 text-body-lg font-body text-foreground"
                      placeholder="Jerry Doe"
                      value={formData.holderName}
                      onChangeText={(text) => setFormData({ ...formData, holderName: text })}
                    />
                  </View>

                  <View>
                    <Text className="text-sm font-bold text-muted-foreground mb-1.5 ml-1">
                      {formData.type === "card" ? "Card Number" : "Phone Number"}
                    </Text>
                    <TextInput
                      className="bg-background border border-border rounded-2xl px-4 py-3.5 text-body-lg font-body text-foreground"
                      placeholder={
                        formData.type === "card" ? "**** **** **** 4242" : "024 123 4567"
                      }
                      keyboardType={formData.type === "card" ? "numeric" : "phone-pad"}
                      value={formData.details}
                      onChangeText={(text) => setFormData({ ...formData, details: text })}
                    />
                  </View>

                  {formData.type === "card" && (
                    <View>
                      <Text className="text-sm font-bold text-muted-foreground mb-1.5 ml-1">
                        Expiry Date
                      </Text>
                      <TextInput
                        className="bg-background border border-border rounded-2xl px-4 py-3.5 text-body-lg font-body text-foreground"
                        placeholder="MM/YY"
                        value={formData.expiry}
                        onChangeText={(text) => setFormData({ ...formData, expiry: text })}
                      />
                    </View>
                  )}
                </View>
              </ScrollView>

              <Pressable
                onPress={handleSave}
                className="bg-primary py-4 rounded-full items-center mt-2"
              >
                <Text className="text-white font-bold text-body-lg">Save Payment Method</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  );
}
