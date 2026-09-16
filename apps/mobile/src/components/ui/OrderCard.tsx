import { tokens } from "@/theme/tokens";
import { View, Text, Pressable } from "react-native";
import { Icon } from "./Icon";
import { Card } from "./Card";

export interface OrderItem {
  name: string;
  qty: number;
}

export interface OrderCardProps {
  id: string;
  date: string;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  items: OrderItem[];
  customerName?: string;
  onPress?: () => void;
  actionLabel?: string;
  onActionPress?: () => void;
  variant?: "customer" | "vendor";
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  processing: { label: "Processing", color: "#d97706", bg: "#fef3c7", icon: "loader" },
  shipped: { label: "Shipped", color: tokens.primary, bg: "#e0e7ff", icon: "truck" },
  delivered: { label: "Delivered", color: "#059669", bg: "#d1fae5", icon: "check-circle" },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "#fee2e2", icon: "x-circle" },
};

export function OrderCard({
  id,
  date,
  status,
  total,
  items,
  customerName,
  onPress,
  actionLabel,
  onActionPress,
  variant = "customer",
}: OrderCardProps) {
  const statusDetails = statusConfig[status];
  const itemCount = items.reduce((acc, item) => acc + item.qty, 0);
  const itemsText = items.map((i) => `${i.qty}x ${i.name}`).join(", ");

  if (variant === "vendor") {
    return (
      <Pressable
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        className="flex-row items-center py-[14px] border-b border-border bg-card"
        onPress={onPress}
      >
        <View className="w-9 h-9 rounded-full bg-muted items-center justify-center mr-3">
          <Icon name="user" size={16} color={tokens.textMuted} />
        </View>
        <View className="flex-1 mr-2">
          <View className="flex-row items-center mb-0.5">
            <Text className="text-[15px] font-semibold text-foreground font-body leading-[22px] mr-2">
              {customerName || "Customer"}
            </Text>
            <View
              className="px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: statusDetails.bg }}
            >
              <Text className="text-[10px] font-bold" style={{ color: statusDetails.color }}>
                {statusDetails.label}
              </Text>
            </View>
          </View>
          <Text className="text-[11px] font-body text-muted-foreground" numberOfLines={1}>
            #{id} · {date} · {itemCount} {itemCount === 1 ? "item" : "items"}
          </Text>
        </View>
        <Text
          className="text-[17px] font-extrabold text-foreground tracking-[-0.02em]"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {total.toFixed(2)}
        </Text>
      </Pressable>
    );
  }

  // Customer Variant
  return (
    <Pressable
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      className="mb-4"
      onPress={onPress}
    >
      <Card variant="outlined" padding="md">
        <View className="flex-row justify-between items-start mb-3">
          <View>
            <Text className="text-[15px] font-semibold text-foreground leading-[22px]">
              Order #{id}
            </Text>
            <Text className="text-[12px] font-body text-muted-foreground mt-0.5">{date}</Text>
          </View>
          <View
            className="flex-row items-center px-3 py-1.5 rounded-full"
            style={{ backgroundColor: statusDetails.bg }}
          >
            <Icon name={statusDetails.icon} size={12} color={statusDetails.color} />
            <Text className="text-[12px] font-bold ml-1.5" style={{ color: statusDetails.color }}>
              {statusDetails.label}
            </Text>
          </View>
        </View>

        <Text className="text-[12px] font-body text-muted-foreground mb-4" numberOfLines={1}>
          {itemsText}
        </Text>

        <View className="flex-row justify-between items-center">
          <Text
            className="text-[18px] font-extrabold text-foreground tracking-[-0.02em]"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            GHS {total.toFixed(2)}
          </Text>

          {status !== "cancelled" && actionLabel && onActionPress && (
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className="bg-primary-subtle px-4 py-2 rounded-full"
              onPress={onActionPress}
            >
              <Text className="text-[12px] font-bold text-primary">{actionLabel}</Text>
            </Pressable>
          )}
        </View>
      </Card>
    </Pressable>
  );
}
