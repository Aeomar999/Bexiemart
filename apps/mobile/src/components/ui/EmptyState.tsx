import React from "react";
import { View, Text, Pressable } from "react-native";
import { Icon } from "./Icon";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  iconName?: string;
  actionLabel?: string;
  onAction?: () => void;
  fullScreen?: boolean;
}

export function EmptyState({
  title,
  description,
  icon,
  iconName,
  actionLabel,
  onAction,
  fullScreen = true,
}: EmptyStateProps) {
  const finalIcon = icon || iconName || "inbox";

  return (
    <View
      className={`items-center justify-center ${fullScreen ? "w-full bg-background" : "p-8 py-12"}`}
      style={fullScreen ? { flex: 1, justifyContent: "center", alignItems: "center" } : undefined}
    >
      <View className="h-20 w-20 rounded-full bg-brand-50 items-center justify-center mb-6">
        <Icon name={finalIcon as any} size={32} color="#004CFF" />
      </View>

      <Text className="text-[24px] font-heading font-black text-foreground mb-3 text-center">
        {title}
      </Text>

      <Text className="text-[16px] font-body text-muted-foreground text-center mb-8 max-w-[85%] leading-relaxed">
        {description}
      </Text>

      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          className="bg-brand-600 px-8 py-4 rounded-full flex-row items-center justify-center shadow-[0_4px_12px_rgba(0,76,255,0.15)]"
        >
          <Text className="text-white font-heading font-bold text-[16px]">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
