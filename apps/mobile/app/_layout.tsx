import "react-native-get-random-values";
import "../global.css";
import "../src/lib/sentry";
import { Stack, useRouter, useRootNavigationState, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useFonts } from "expo-font";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "../src/lib/stores/auth-store";
import { LoadingSpinner } from "../src/components/ui/LoadingSpinner";
import { GlobalPopup } from "../src/components/ui/GlobalPopup";
import { ErrorBoundary } from "../src/components/ui/ErrorBoundary";
import { AnimatedSplashScreen } from "../src/components/screens/AnimatedSplashScreen";
import { PaystackProvider } from "react-native-paystack-webview";
import { OfflineBanner } from "../src/components/ui/OfflineBanner";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isLoading = useAuthStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);
  const hasSeenOnboarding = useAuthStore((s) => s.hasSeenOnboarding);
  const hasLaunchedBefore = useAuthStore((s) => s.hasLaunchedBefore);
  const [splashDone, setSplashDone] = useState(false);

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
  const segments = useSegments();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    // Wait until the root layout has mounted completely, fonts loaded, auth hydrated, and splash finished
    if (!rootNavigationState?.key || !fontsLoaded || isLoading || !splashDone) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboardingGroup = segments[0] === "(onboarding)";

    try {
      if (isAuthenticated && (inAuthGroup || inOnboardingGroup || !segments[0])) {
        if (user?.role === "VENDOR") {
          router.replace("/(vendor)/(tabs)/(dashboard)");
        } else if (user?.role === "DISPATCHER") {
          router.replace("/(dispatcher)/(tabs)/(dashboard)");
        } else {
          router.replace("/(customer)/(tabs)/(home)");
        }
      } else if (!isAuthenticated) {
        if (!hasLaunchedBefore && !inOnboardingGroup) {
          router.replace("/(onboarding)/welcome");
        } else if (hasLaunchedBefore && !inAuthGroup && !inOnboardingGroup) {
          router.replace("/(auth)/login");
        }
      }
    } catch (err) {
      console.warn("Navigation failed (likely due to ErrorBoundary removing Stack):", err);
    }
  }, [
    isLoading,
    isAuthenticated,
    user?.role,
    hasLaunchedBefore,
    hasSeenOnboarding,
    splashDone,
    rootNavigationState?.key,
    segments,
    fontsLoaded,
  ]);

  return (
    <SafeAreaProvider>
      <OfflineBanner />
      <QueryClientProvider client={queryClient}>
        <PaystackProvider
          publicKey={process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder"}
        >
          <StatusBar style="dark" />
          <ErrorBoundary>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(customer)" />
              <Stack.Screen name="(vendor)" />
              <Stack.Screen name="(dispatcher)" />
            </Stack>
            {(!fontsLoaded || isLoading || !splashDone) && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "white",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 9999,
                }}
              >
                {!fontsLoaded || isLoading ? null : (
                  <AnimatedSplashScreen onAnimationComplete={() => setSplashDone(true)} />
                )}
              </View>
            )}
            <GlobalPopup />
          </ErrorBoundary>
        </PaystackProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
