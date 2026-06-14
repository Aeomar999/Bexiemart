import React from "react";
import { View, Text, Pressable } from "react-native";
import { Icon } from "./Icon";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this data. Please try again.",
  onRetry,
  fullScreen = true,
}: ErrorStateProps) {
  return (
    <View
      className={`items-center justify-center ${fullScreen ? "w-full bg-background" : "p-8 py-12"}`}
      style={fullScreen ? { flex: 1, justifyContent: "center", alignItems: "center" } : undefined}
    >
      <View className="h-20 w-20 rounded-full bg-rose-50 items-center justify-center mb-6">
        <Icon name="alert-triangle" size={32} color="#ef4444" />
      </View>

      <Text className="text-[24px] font-heading font-black text-foreground mb-3 text-center">
        {title}
      </Text>

      <Text className="text-[16px] font-body text-muted-foreground text-center mb-8 max-w-[85%] leading-relaxed">
        {message}
      </Text>

      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          className="bg-error px-8 py-4 rounded-full flex-row items-center justify-center shadow-[0_4px_12px_rgba(239,68,68,0.15)]"
        >
          <View className="mr-2">
            <Icon name="refresh-cw" size={18} color="white" />
          </View>
          <Text className="text-white font-heading font-bold text-[16px]">Try Again</Text>
        </Pressable>
      )}
    </View>
  );
}
