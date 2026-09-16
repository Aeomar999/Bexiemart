import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "";

/**
 * Loud, impossible-to-miss indicator that payments run against Paystack TEST
 * keys. Renders in release builds too — by decision, test mode may ship, but
 * it must never ship silently.
 */
export function PaymentTestModeBanner() {
  const insets = useSafeAreaInsets();
  if (!KEY.startsWith("pk_test_")) return null;
  return (
    <View
      accessibilityRole="alert"
      className="bg-amber-500 items-center justify-center py-1"
      style={{ marginTop: insets.top > 0 ? 0 : 4 }}
    >
      <Text className="text-xs font-bold text-black">
        PAYMENTS IN TEST MODE — no real money moves
      </Text>
    </View>
  );
}
