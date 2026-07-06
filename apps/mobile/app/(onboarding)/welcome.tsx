import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../src/lib/stores/auth-store";
import { useAuthEnabled } from "../../src/lib/feature-flags";
import { Button } from "../../src/components/ui/Button";
// @ts-expect-error
import { FontAwesome5 } from "@expo/vector-icons";

export default function WelcomeScreen() {
  const router = useRouter();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const { authEnabled } = useAuthEnabled();

  const handleGetStarted = () => {
    // Navigate to the onboarding carousel
    router.push("/(onboarding)");
  };

  const handleLogin = async () => {
    await completeOnboarding();
    // With the auth wall flagged off there's no login to send them to, so drop
    // them straight into the app as a guest.
    router.replace(authEnabled ? "/(auth)/login" : "/(customer)/(tabs)/(home)");
  };

  return (
    <View className="flex-1 bg-white items-center px-6">
      <View className="flex-1 w-full items-center justify-center pt-20">
        <View className="w-24 h-24 rounded-3xl bg-primary items-center justify-center mb-8">
          <FontAwesome5 name="store" size={42} color="#FFFFFF" solid />
        </View>
        <Text className="text-[40px] font-heading font-black text-foreground text-center mb-2 leading-[48px]">
          Bexie<Text className="text-primary">Mart</Text>
        </Text>
        <Text className="text-body-lg text-muted-foreground font-body text-center">
          Shop smart on campus
        </Text>
      </View>

      <View className="w-full pb-16 gap-4">
        <Button
          title="Get Started"
          size="lg"
          onPress={handleGetStarted}
          className="rounded-full py-4 bg-primary"
          textClassName="text-lg font-bold text-white"
        />
        <TouchableOpacity
          onPress={handleLogin}
          className="w-full py-4 items-center justify-center rounded-full border border-border"
        >
          <Text className="text-lg font-bold font-body text-foreground">
            I already have an account
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
