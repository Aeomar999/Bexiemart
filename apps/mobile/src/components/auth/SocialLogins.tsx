import { View, Text, TouchableOpacity } from "react-native";
// @ts-expect-error FontAwesome5 may not be exported from @expo/vector-icons
import { FontAwesome5 } from "@expo/vector-icons";

export function SocialLogins() {
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
        >
          <FontAwesome5 name="apple" size={24} color="#000000" />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          className="w-14 h-14 rounded-2xl border border-border bg-card items-center justify-center active:bg-background"
          activeOpacity={0.7}
        >
          <FontAwesome5 name="google" size={22} color="#DB4437" />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          className="w-14 h-14 rounded-2xl border border-border bg-card items-center justify-center active:bg-background"
          activeOpacity={0.7}
        >
          <FontAwesome5 name="facebook" size={24} color="#1877F2" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
