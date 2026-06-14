import React from "react";
import { View, Text } from "react-native";
// @ts-expect-error
import { FontAwesome5 } from "@expo/vector-icons";

export type AnnouncementType = "error" | "success" | "warning" | "info";

interface AnnouncementProps {
  message: string;
  type?: AnnouncementType;
}

export function Announcement({ message, type = "error" }: AnnouncementProps) {
  if (!message) return null;

  let bgClass = "bg-error/10";
  let borderClass = "border-error/20";
  let textClass = "text-error";
  let iconName = "exclamation-circle";
  let iconColor = "#ef4444"; // default text-error in most tailwind setups

  switch (type) {
    case "success":
      bgClass = "bg-success/10";
      borderClass = "border-success/20";
      textClass = "text-success";
      iconName = "check-circle";
      iconColor = "#22c55e";
      break;
    case "warning":
      bgClass = "bg-warning/10";
      borderClass = "border-warning/20";
      textClass = "text-warning";
      iconName = "exclamation-triangle";
      iconColor = "#f59e0b";
      break;
    case "info":
      bgClass = "bg-primary/10";
      borderClass = "border-primary/20";
      textClass = "text-primary";
      iconName = "info-circle";
      iconColor = "var(--color-primary)";
      break;
  }

  return (
    <View className={`flex-row items-start p-4 rounded-2xl border ${bgClass} ${borderClass}`}>
      <View className="mr-3 mt-0.5">
        <FontAwesome5 name={iconName} size={16} color={iconColor} solid />
      </View>
      <View className="flex-1">
        <Text className={`font-body text-body-sm leading-5 ${textClass}`}>{message}</Text>
      </View>
    </View>
  );
}
