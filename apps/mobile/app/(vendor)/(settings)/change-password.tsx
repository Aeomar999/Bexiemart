import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Simple password strength calculation
  const getStrength = (pass: string) => {
    if (pass.length === 0) return 0;
    if (pass.length < 6) return 1;
    if (pass.length < 8 || !/\d/.test(pass)) return 2;
    if (pass.length >= 8 && /\d/.test(pass) && /[!@#$%^&*]/.test(pass)) return 3;
    return 2;
  };

  const strength = getStrength(newPassword);
  const strengthColor = strength === 0 ? "bg-accent" : strength === 1 ? "bg-red-500" : strength === 2 ? "bg-amber-500" : "bg-green-500";
  const strengthText = strength === 0 ? "" : strength === 1 ? "Weak" : strength === 2 ? "Good" : "Strong";

  const isFormValid = currentPassword.length > 0 && newPassword.length > 0 && newPassword === confirmPassword && strength > 1;

  return (
    <View className="flex-1 bg-background">
      <View 
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton className="w-10 h-10 rounded-full bg-background items-center justify-center mr-3" color="#0f172a" />
        <Text className="text-[20px] font-heading font-black text-foreground">
          Change Password
        </Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        <Text className="text-[14px] text-muted-foreground mb-6 leading-relaxed">
          Your password must be at least 8 characters long and include a mix of letters, numbers, and symbols.
        </Text>

        <View className="mb-5">
          <Text className="text-[13px] font-bold text-muted-foreground mb-2">Current Password</Text>
          <View className="flex-row items-center bg-card border border-border rounded-[16px] px-4 h-[56px]">
            <Icon name="lock" size={20} color="#94a3b8" />
            <TextInput 
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrent}
              placeholder="Enter current password"
              className="flex-1 ml-3 text-[15px] font-body text-foreground h-full"
            />
            <Pressable onPress={() => setShowCurrent(!showCurrent)} className="p-2">
              <Icon name={showCurrent ? "eye-off" : "eye"} size={20} color="#94a3b8" />
            </Pressable>
          </View>
        </View>

        <View className="mb-5">
          <Text className="text-[13px] font-bold text-muted-foreground mb-2">New Password</Text>
          <View className="flex-row items-center bg-card border border-border rounded-[16px] px-4 h-[56px]">
            <Icon name="key" size={20} color="#94a3b8" />
            <TextInput 
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              placeholder="Enter new password"
              className="flex-1 ml-3 text-[15px] font-body text-foreground h-full"
            />
            <Pressable onPress={() => setShowNew(!showNew)} className="p-2">
              <Icon name={showNew ? "eye-off" : "eye"} size={20} color="#94a3b8" />
            </Pressable>
          </View>
          
          {/* Password Strength Indicator */}
          {newPassword.length > 0 && (
            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-row gap-1 flex-1 mr-4">
                <View className={`h-1.5 flex-1 rounded-full ${strength >= 1 ? strengthColor : 'bg-accent'}`} />
                <View className={`h-1.5 flex-1 rounded-full ${strength >= 2 ? strengthColor : 'bg-accent'}`} />
                <View className={`h-1.5 flex-1 rounded-full ${strength >= 3 ? strengthColor : 'bg-accent'}`} />
              </View>
              <Text className={`text-[12px] font-bold ${strength === 1 ? 'text-red-500' : strength === 2 ? 'text-amber-500' : 'text-green-500'}`}>
                {strengthText}
              </Text>
            </View>
          )}
        </View>

        <View className="mb-8">
          <Text className="text-[13px] font-bold text-muted-foreground mb-2">Confirm New Password</Text>
          <View className="flex-row items-center bg-card border border-border rounded-[16px] px-4 h-[56px]">
            <Icon name="check-circle" size={20} color="#94a3b8" />
            <TextInput 
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              placeholder="Confirm new password"
              className="flex-1 ml-3 text-[15px] font-body text-foreground h-full"
            />
            <Pressable onPress={() => setShowConfirm(!showConfirm)} className="p-2">
              <Icon name={showConfirm ? "eye-off" : "eye"} size={20} color="#94a3b8" />
            </Pressable>
          </View>
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <Text className="text-[12px] text-red-500 mt-2 ml-1">Passwords do not match.</Text>
          )}
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
          <Text className="text-[14px] font-bold text-brand-600">Forgot Current Password?</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
