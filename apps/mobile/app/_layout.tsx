import "../global.css";
import { Stack, useRouter, useRootNavigationState } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "../src/lib/stores/auth-store";
import { LoadingSpinner } from "../src/components/ui/LoadingSpinner";
import { GlobalPopup } from "../src/components/ui/GlobalPopup";
import { PaystackProvider } from 'react-native-paystack-webview';
import {
  Raleway_400Regular,
  Raleway_600SemiBold,
  Raleway_700Bold,
} from "@expo-google-fonts/raleway";
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";

import { SafeAreaProvider } from "react-native-safe-area-context";

const queryClient = new QueryClient();

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [fontsLoaded] = useFonts({
    Raleway_400Regular,
    Raleway_600SemiBold,
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    // Wait until the root layout has mounted completely
    if (!rootNavigationState?.key) return;

    if (!isLoading && !isAuthenticated) {
      // If the user isn't authenticated (e.g., token expired or manually logged out), kick them to auth
      router.replace("/(auth)/login");
    }
  }, [isLoading, isAuthenticated, rootNavigationState?.key]);

  if (!fontsLoaded || isLoading) {
    return (
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
            <LoadingSpinner fullScreen message="Loading BexieMart..." />
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaystackProvider publicKey={process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder"}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(customer)" />
            <Stack.Screen name="(vendor)" />
            <Stack.Screen name="(dispatcher)" />
          </Stack>
          <GlobalPopup />
        </PaystackProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
