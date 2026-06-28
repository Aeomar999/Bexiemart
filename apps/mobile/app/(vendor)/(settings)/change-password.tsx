import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState } from "react";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Simple password strength calculation
  const getStrength = (pass: string) => {
    if (pass.length === 0) return 0;
    if (pass.length < 6) return 1;
    if (pass.length < 8 || !/\d/.test(pass)) return 2;
    if (pass.length >= 8 && /\d/.test(pass) && /[!@#$%^&*]/.test(pass)) return 3;
    return 2;
  };

  const strength = getStrength(newPassword);
  const strengthColor =
    strength === 0
      ? "bg-secondary"
      : strength === 1
        ? "bg-red-500"
        : strength === 2
          ? "bg-amber-500"
          : "bg-green-500";
  const strengthText =
    strength === 0 ? "" : strength === 1 ? "Weak" : strength === 2 ? "Good" : "Strong";

  const isFormValid =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    newPassword === confirmPassword &&
    strength > 1;

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton
          className="w-10 h-10 rounded-full bg-background items-center justify-center mr-3"
          color="#0f172a"
        />
        <Text className="text-display-sm font-heading font-black text-foreground">
          Change Password
        </Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        <Text className="text-body-md text-muted-foreground mb-6 leading-relaxed">
          Your password must be at least 8 characters long and include a mix of letters, numbers,
          and symbols.
        </Text>

        <View className="mb-5">
          <Input
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={true}
            placeholder="Enter current password"
            leftIcon={<Icon name="lock" size={20} color="#94a3b8" />}
          />
        </View>

        <View className="mb-5">
          <Input
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={true}
            placeholder="Enter new password"
            leftIcon={<Icon name="key" size={20} color="#94a3b8" />}
          />

          {/* Password Strength Indicator */}
          {newPassword.length > 0 && (
            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-row gap-1 flex-1 mr-4">
                <View
                  className={`h-1.5 flex-1 rounded-full ${strength >= 1 ? strengthColor : "bg-secondary"}`}
                />
                <View
                  className={`h-1.5 flex-1 rounded-full ${strength >= 2 ? strengthColor : "bg-secondary"}`}
                />
                <View
                  className={`h-1.5 flex-1 rounded-full ${strength >= 3 ? strengthColor : "bg-secondary"}`}
                />
              </View>
              <Text
                className={`text-body-sm font-bold ${strength === 1 ? "text-red-500" : strength === 2 ? "text-amber-500" : "text-green-500"}`}
              >
                {strengthText}
              </Text>
            </View>
          )}
        </View>

        <View className="mb-8">
          <Input
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={true}
            placeholder="Confirm new password"
            leftIcon={<Icon name="check-circle" size={20} color="#94a3b8" />}
            error={
              confirmPassword.length > 0 && newPassword !== confirmPassword
                ? "Passwords do not match."
                : undefined
            }
          />
        </View>

        <Button
          title="Update Password"
          variant="primary"
          disabled={!isFormValid}
          onPress={() => {
            // Mock successful save
            router.back();
          }}
        />
        <Pressable className="mt-6 self-center" onPress={() => {}}>
          <Text className="text-body-md font-bold text-primary">Forgot Current Password?</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
