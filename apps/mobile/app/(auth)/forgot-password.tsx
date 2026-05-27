import { BackButton } from "@/components/ui/BackButton";
import { View, Text, Alert, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { Input } from "../../src/components/ui/Input";
import { Button } from "../../src/components/ui/Button";
import { authApi } from "../../src/lib/api/auth";
// @ts-expect-error
import { FontAwesome5 } from "@expo/vector-icons";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      Alert.alert("Error", "Could not send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background px-6">
      <View className="mb-10 pt-16">
        <BackButton className="mb-8" />
      </View>

      {sent ? (
        <View className="flex-1 items-center justify-start">
          <View className="w-24 h-24 rounded-full bg-success-light items-center justify-center mb-6 shadow-sm border border-success/10">
            <FontAwesome5 name="check-circle" size={40} color="#00D084" solid />
          </View>
          <Text className="text-display-sm font-heading font-bold text-foreground text-center mb-3">
            Check your email
          </Text>
          <Text className="text-body-md text-muted-foreground font-body text-center max-w-[280] leading-relaxed mb-8">
            We sent a password reset link to <Text className="font-bold text-muted-foreground">{email}</Text>
          </Text>
          <View className="w-full">
            <Button
              title="Back to login"
              variant="outline"
              size="lg"
              onPress={() => router.replace("/(auth)/login")}
            />
          </View>
        </View>
      ) : (
        <View>
          <View className="w-16 h-16 rounded-2xl bg-brand-100 items-center justify-center mb-6">
            <FontAwesome5 name="key" size={24} color="#004CFF" solid />
          </View>
          <Text className="text-display-md font-heading font-bold text-foreground mb-2">
            Forgot password?
          </Text>
          <Text className="text-body-lg text-muted-foreground font-body mb-8">
            Enter your email and we'll send you a reset link
          </Text>

          <View className="bg-card p-6 rounded-3xl shadow-sm border border-border gap-5">
            <Input
              label="Email address"
              placeholder="you@school.edu.gh"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              leftIcon={<FontAwesome5 name="envelope" size={16} color="#94A3B8" solid />}
            />

            <View className="w-full mt-2">
              <Button
                title="Send Reset Link"
                size="lg"
                loading={loading}
                disabled={!email.trim()}
                onPress={handleSubmit}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}