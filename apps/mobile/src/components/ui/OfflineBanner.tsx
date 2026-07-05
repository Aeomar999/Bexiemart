import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetwork } from "@/hooks/useNetwork";

export function OfflineBanner() {
  const { isConnected } = useNetwork();
  const insets = useSafeAreaInsets();
  if (isConnected) return null;

  return (
    <View className="bg-error px-4 pb-2" style={{ paddingTop: insets.top + 8 }}>
      <Text className="text-white text-center font-bold text-sm">
        No internet connection — some features may be unavailable
      </Text>
    </View>
  );
}
