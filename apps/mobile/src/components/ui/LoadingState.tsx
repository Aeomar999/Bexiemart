import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Icon } from "@/components/ui/Icon";

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({ message = "Loading...", fullScreen = true }: LoadingStateProps) {
  return (
    <View
      className={`items-center justify-center ${fullScreen ? "w-full bg-background" : "p-8 py-12"}`}
      style={fullScreen ? { flex: 1, justifyContent: "center", alignItems: "center" } : undefined}
    >
      <View className="h-20 w-20 rounded-full bg-brand-50 items-center justify-center mb-6">
        <ActivityIndicator size="large" color="#004CFF" />
      </View>

      {message && (
        <Text className="text-[16px] font-heading font-bold text-foreground mt-2 text-center">
          {message}
        </Text>
      )}
    </View>
  );
}
