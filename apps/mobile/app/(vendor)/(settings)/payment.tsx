import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, Modal } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState } from "react";
import { useVendorPaymentMethods, useAddBankAccount, useAddMomoAccount, useRemovePaymentMethod, useSetDefaultPaymentMethod } from "@/lib/hooks/use-vendor-payment-methods";

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { data: paymentMethods, isLoading } = useVendorPaymentMethods();
  const addBank = useAddBankAccount();
  const addMomo = useAddMomoAccount();
  const removeMethod = useRemovePaymentMethod();
  const setDefaultMethod = useSetDefaultPaymentMethod();

  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [addType, setAddType] = useState<"bank" | "momo">("momo");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [provider, setProvider] = useState("mtn");

  const openAddModal = (type: "bank" | "momo") => {
    setAddType(type);
    setAccountName("");
    setAccountNumber("");
    setBankName("");
    setProvider("mtn");
    setAddModalVisible(true);
  };

  const handleAdd = () => {
    if (!accountName || !accountNumber) {
      Alert.alert("Required", "Please fill in all fields.");
      return;
    }
    if (addType === "bank") {
      addBank.mutate({ accountName, accountNumber, bankName });
    } else {
      addMomo.mutate({ accountName, accountNumber, provider });
    }
    setAddModalVisible(false);
  };

  const methods = paymentMethods ?? [];

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View 
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center justify-between"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row items-center">
          <BackButton className="mr-3" />
          <Text className="text-[20px] font-heading font-black text-foreground">
            Payout Methods
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#004CFF" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-5 pt-6 pb-12">
          <Text className="text-[14px] text-muted-foreground mb-6 leading-relaxed">
            Manage where your earnings are sent when you request a withdrawal. You can add up to 3 payout methods.
          </Text>

          <View className="gap-4 mb-6">
            {methods.map((method: any) => (
              <View key={method.id} className="bg-card rounded-[20px] border border-border p-5">
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-row items-center">
                    <View 
                      className="w-12 h-12 rounded-full items-center justify-center mr-4"
                      style={{ backgroundColor: method.bg }}
                    >
                      <Icon name={method.icon} size={20} color={method.color} />
                    </View>
                    <View>
                      <Text className="text-[16px] font-bold text-foreground mb-0.5">{method.title}</Text>
                      <Text className="text-[14px] text-muted-foreground">{method.account}</Text>
                    </View>
                  </View>
                  {method.isDefault && (
                    <View className="bg-green-100 px-2 py-1 rounded-full">
                      <Text className="text-[10px] font-bold text-green-700">DEFAULT</Text>
                    </View>
                  )}
                </View>
                
                <View className="flex-row border-t border-border pt-3">
                  {!method.isDefault && (
                    <Pressable
                      className="flex-1 items-center border-r border-border py-1"
                      onPress={() => setDefaultMethod.mutate({ type: method.type, id: method.id })}
                    >
                      <Text className="text-[14px] font-bold text-muted-foreground">Set as Default</Text>
                    </Pressable>
                  )}
                  <Pressable
                    className="flex-1 items-center py-1"
                    onPress={() => {
                      Alert.alert("Remove", "Are you sure?", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Remove", style: "destructive", onPress: () => removeMethod.mutate({ type: method.type, id: method.id }) },
                      ]);
                    }}
                  >
                    <Text className="text-[14px] font-bold text-rose-500">Remove</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          <View className="gap-3">
            <Pressable
              onPress={() => openAddModal("momo")}
              className="bg-brand-50 border border-brand-200 border-dashed rounded-[20px] p-6 items-center justify-center flex-row"
            >
              <Icon name="smartphone" size={20} color="#004CFF" style={{ marginRight: 8 }} />
              <Text className="text-[16px] font-bold text-brand-600">Add Mobile Money</Text>
            </Pressable>
            <Pressable
              onPress={() => openAddModal("bank")}
              className="bg-brand-50 border border-brand-200 border-dashed rounded-[20px] p-6 items-center justify-center flex-row"
            >
              <Icon name="briefcase" size={20} color="#004CFF" style={{ marginRight: 8 }} />
              <Text className="text-[16px] font-bold text-brand-600">Add Bank Account</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* Add Payment Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setAddModalVisible(false)} />
          <View className="bg-card rounded-t-[32px] p-6 pb-12">
            <View className="w-12 h-1.5 bg-accent rounded-full self-center mb-6" />
            <Text className="text-[20px] font-heading font-bold text-foreground mb-6">
              Add {addType === "bank" ? "Bank Account" : "Mobile Money"}
            </Text>
            
            <View className="gap-4">
              <Input label="Account Name" placeholder="e.g. John Doe" value={accountName} onChangeText={setAccountName} />
              <Input label="Account Number" placeholder="e.g. 024XXXXXXX" value={accountNumber} onChangeText={setAccountNumber} keyboardType="phone-pad" />
              {addType === "bank" && (
                <Input label="Bank Name" placeholder="e.g. Ecobank" value={bankName} onChangeText={setBankName} />
              )}
              <Button
                title="Add Method"
                size="lg"
                loading={addBank.isPending || addMomo.isPending}
                onPress={handleAdd}
                className="mt-4"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
