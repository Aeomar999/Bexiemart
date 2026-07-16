import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState } from "react";
import { usePinStatus, useChangePin, useSetPin } from "@/lib/hooks/use-wallet";
import { usePopupStore } from "@/lib/stores/popup-store";

export default function ChangePinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: pinStatus } = usePinStatus();
  const changePin = useChangePin();
  const setPin = useSetPin();
  const showPopup = usePopupStore((s) => s.showPopup);

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const hasPin = pinStatus?.hasPin !== false;
  const isPending = changePin.isPending || setPin.isPending;

  const isFormValid =
    (!hasPin || currentPin.length === 4) &&
    newPin.length === 4 &&
    newPin === confirmPin &&
    !isPending;

  const onSubmit = async () => {
    try {
      if (hasPin) {
        await changePin.mutateAsync({ currentPin, newPin });
      } else {
        await setPin.mutateAsync(newPin);
      }
      showPopup({
        type: "success",
        title: "PIN updated",
        message: hasPin
          ? "Your withdrawal PIN has been changed."
          : "Your withdrawal PIN has been set.",
      });
      router.back();
    } catch (e: any) {
      showPopup({
        type: "error",
        title: "Couldn't update PIN",
        message: e?.response?.data?.message || e?.message || "Check your current PIN.",
      });
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton className="mr-3" />
        <Text className="text-display-sm font-heading font-black text-foreground">
          {hasPin ? "Change Withdrawal PIN" : "Set Withdrawal PIN"}
        </Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        <Text className="text-body-md text-muted-foreground mb-8 leading-relaxed">
          Your 4-digit PIN is required to authorize withdrawals and sensitive account changes. Keep
          it safe.
        </Text>

        {hasPin && (
          <View className="mb-5">
            <Input
              label="Current PIN"
              value={currentPin}
              onChangeText={setCurrentPin}
              secureTextEntry={true}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="••••"
              className="tracking-[4px] text-display-sm"
              leftIcon={<Icon name="lock" size={20} color="#94a3b8" />}
            />
          </View>
        )}

        <View className="mb-5">
          <Input
            label="New PIN"
            value={newPin}
            onChangeText={setNewPin}
            secureTextEntry={true}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="••••"
            className="tracking-[4px] text-display-sm"
            leftIcon={<Icon name="key" size={20} color="#94a3b8" />}
          />
        </View>

        <View className="mb-8">
          <Input
            label="Confirm New PIN"
            value={confirmPin}
            onChangeText={setConfirmPin}
            secureTextEntry={true}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="••••"
            className="tracking-[4px] text-display-sm"
            leftIcon={<Icon name="check-circle" size={20} color="#94a3b8" />}
            error={
              confirmPin.length === 4 && newPin !== confirmPin ? "PINs do not match." : undefined
            }
          />
        </View>

        <Button
          title={hasPin ? "Update PIN" : "Set PIN"}
          variant="primary"
          disabled={!isFormValid}
          loading={isPending}
          onPress={onSubmit}
        />
        {hasPin && (
          <View className="mt-6 self-center items-center">
            <Pressable onPress={() => router.push("/(vendor)/(settings)/contact")}>
              <Text className="text-body-md font-bold text-primary">
                Forgot PIN? Contact Support
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
