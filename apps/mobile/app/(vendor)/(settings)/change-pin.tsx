import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export default function ChangePinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const isFormValid = currentPin.length === 4 && newPin.length === 4 && newPin === confirmPin;

  return (
    <View className="flex-1 bg-background">
      <View 
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton className="mr-3" />
        <Text className="text-[20px] font-heading font-black text-foreground">
          Change Withdrawal PIN
        </Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        <Text className="text-[14px] text-muted-foreground mb-8 leading-relaxed">
          Your 4-digit PIN is required to authorize withdrawals and sensitive account changes. Keep it safe.
        </Text>

        <View className="mb-5">
          <Text className="text-[13px] font-bold text-muted-foreground mb-2">Current PIN</Text>
          <View className="flex-row items-center bg-card border border-border rounded-[16px] px-4 h-[56px]">
            <Icon name="lock" size={20} color="#94a3b8" />
            <TextInput 
              value={currentPin}
              onChangeText={setCurrentPin}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
              placeholder="••••"
              className="flex-1 ml-3 text-[20px] tracking-[4px] font-body text-foreground h-full"
            />
          </View>
        </View>

        <View className="mb-5">
          <Text className="text-[13px] font-bold text-muted-foreground mb-2">New PIN</Text>
          <View className="flex-row items-center bg-card border border-border rounded-[16px] px-4 h-[56px]">
            <Icon name="key" size={20} color="#94a3b8" />
            <TextInput 
              value={newPin}
              onChangeText={setNewPin}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
              placeholder="••••"
              className="flex-1 ml-3 text-[20px] tracking-[4px] font-body text-foreground h-full"
            />
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-[13px] font-bold text-muted-foreground mb-2">Confirm New PIN</Text>
          <View className="flex-row items-center bg-card border border-border rounded-[16px] px-4 h-[56px]">
            <Icon name="check-circle" size={20} color="#94a3b8" />
            <TextInput 
              value={confirmPin}
              onChangeText={setConfirmPin}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
              placeholder="••••"
              className="flex-1 ml-3 text-[20px] tracking-[4px] font-body text-foreground h-full"
            />
          </View>
          {confirmPin.length === 4 && newPin !== confirmPin && (
            <Text className="text-[12px] text-red-500 mt-2 ml-1">PINs do not match.</Text>
          )}
        </View>

        <Button 
          title="Update PIN" 
          variant="primary" 
          disabled={!isFormValid}
          onPress={() => {
            // Mock successful save
            router.back();
          }}
        />
        <Pressable className="mt-6 self-center" onPress={() => {}}>
          <Text className="text-[14px] font-bold text-brand-600">Forgot PIN?</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
