import { View, Text } from "react-native";

interface BadgeProps {
  count?: number;
  label?: string;
  variant?: "count" | "status" | "discount";
  status?: "success" | "warning" | "error" | "info";
}

const statusColors: Record<string, { bg: string; text: string }> = {
  success: { bg: "bg-success-light", text: "text-success" },
  warning: { bg: "bg-warning-light", text: "text-warning" },
  error: { bg: "bg-error-light", text: "text-error" },
  info: { bg: "bg-primary-subtle", text: "text-primary" },
};

export function Badge({ count, label, variant = "count", status = "info" }: BadgeProps) {
  if (variant === "count") {
    if (!count || count <= 0) return null;
    return (
      <View className="absolute -top-1 -right-1 min-w-[20] h-5 rounded-full bg-secondary items-center justify-center px-1.5">
        <Text className="text-caption font-bold text-white font-body">
          {count > 99 ? "99+" : count}
        </Text>
      </View>
    );
  }

  if (variant === "status" && label) {
    const colors = statusColors[status];
    return (
      <View className={`px-3 py-1 rounded-full ${colors.bg}`}>
        <Text className={`text-caption font-semibold font-body ${colors.text}`}>{label}</Text>
      </View>
    );
  }

  if (variant === "discount" && label) {
    return (
      <View className="absolute top-2 left-2 px-2 py-0.5 rounded bg-secondary">
        <Text className="text-caption font-bold text-white font-body">{label}</Text>
      </View>
    );
  }

  return null;
}
