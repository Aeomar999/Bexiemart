import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
// @ts-expect-error FontAwesome5 may not be exported from @expo/vector-icons
import { FontAwesome5 } from "@expo/vector-icons";
import { useState } from "react";
import { authClient } from "../../lib/api/better-auth";
import { useAuthStore } from "../../lib/stores/auth-store";
import { router } from "expo-router";

interface SocialLoginsProps {
  roleIntent?: "customer" | "vendor";
}

export function SocialLogins({ roleIntent }: SocialLoginsProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const { setAuth } = useAuthStore();

  const handleSocialLogin = async (provider: "google" | "apple" | "facebook") => {
    try {
      setLoadingProvider(provider);
      const callbackURL = `bexiemart://auth/callback${roleIntent ? `?intent=${roleIntent}` : ""}`;

      const res = await authClient.signIn.social({
        provider,
        callbackURL,
      });

      if (res.error) {
        Alert.alert("Sign In Failed", res.error.message || `Could not sign in with ${provider}`);
        return;
      }

      // After returning from browser session, check if we have an active session
      const sessionRes = await authClient.getSession();
      if (sessionRes.data?.user && sessionRes.data?.session) {
        const user = sessionRes.data.user as any;
        const token = sessionRes.data.session.token || sessionRes.data.session.id || "";

        if (roleIntent === "vendor" && user.role !== "VENDOR") {
          user.role = "VENDOR";
        }

        await setAuth(user, token);

        if (roleIntent === "vendor") {
          router.replace("/vendor/setup" as any);
        } else {
          router.replace("/");
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "An unexpected error occurred during social login.");
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <View className="mt-8">
      <View className="flex-row items-center justify-center mb-6">
        <View className="h-[1px] flex-1 bg-secondary" />
        <Text className="text-body-sm text-muted-foreground font-body px-4">Or continue with</Text>
        <View className="h-[1px] flex-1 bg-secondary" />
      </View>

      <View className="flex-row justify-center gap-4">
        <TouchableOpacity
          accessibilityRole="button"
          className="w-14 h-14 rounded-2xl border border-border bg-card items-center justify-center active:bg-background"
          activeOpacity={0.7}
          disabled={!!loadingProvider}
          onPress={() => handleSocialLogin("apple")}
        >
          {loadingProvider === "apple" ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <FontAwesome5 name="apple" size={24} color="#000000" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          className="w-14 h-14 rounded-2xl border border-border bg-card items-center justify-center active:bg-background"
          activeOpacity={0.7}
          disabled={!!loadingProvider}
          onPress={() => handleSocialLogin("google")}
        >
          {loadingProvider === "google" ? (
            <ActivityIndicator size="small" color="#DB4437" />
          ) : (
            <FontAwesome5 name="google" size={22} color="#DB4437" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          className="w-14 h-14 rounded-2xl border border-border bg-card items-center justify-center active:bg-background"
          activeOpacity={0.7}
          disabled={!!loadingProvider}
          onPress={() => handleSocialLogin("facebook")}
        >
          {loadingProvider === "facebook" ? (
            <ActivityIndicator size="small" color="#1877F2" />
          ) : (
            <FontAwesome5 name="facebook" size={24} color="#1877F2" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
