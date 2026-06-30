import { tokens } from "@/theme/tokens";
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
      <View className="h-20 w-20 rounded-full bg-primary-subtle items-center justify-center mb-6">
        <Icon name={finalIcon as any} size={32} color={tokens.primary} />
      </View>

      <Text className="text-display-md font-heading font-black text-foreground mb-3 text-center">
        {title}
      </Text>

      <Text className="text-body-lg font-body text-muted-foreground text-center mb-8 max-w-[85%] leading-relaxed">
        {description}
      </Text>

      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          className="bg-primary px-8 py-4 rounded-full flex-row items-center justify-center shadow-md"
        >
          <Text className="text-white font-heading font-bold text-body-lg">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
