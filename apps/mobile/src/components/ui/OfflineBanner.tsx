import { View, Text } from "react-native";
import { useNetwork } from "@/hooks/useNetwork";

export function OfflineBanner() {
  const { isConnected } = useNetwork();
  if (isConnected) return null;

  return (
    <View className="bg-red-500 px-4 py-2 mt-8">
      <Text className="text-white text-center font-bold text-sm">
        No internet connection — some features may be unavailable
      </Text>
    </View>
  );
}
