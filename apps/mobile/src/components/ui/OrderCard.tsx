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
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  processing: { label: "Processing", color: "#d97706", bg: "#fef3c7", icon: "loader" },
  shipped: { label: "Shipped", color: "var(--color-primary)", bg: "#e0e7ff", icon: "truck" },
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
}: OrderCardProps) {
  const statusDetails = statusConfig[status];

  return (
    <Pressable
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      className="mb-4"
      onPress={onPress}
    >
      <Card variant="outlined" padding="md">
        {/* Order Header */}
        <View className="flex-row justify-between items-start mb-4">
          <View>
            <Text className="text-[14px] font-heading font-bold text-foreground">Order #{id}</Text>
            <Text className="text-body-sm font-body text-muted-foreground mt-0.5">{date}</Text>
            {customerName && (
              <Text className="text-[13px] font-bold text-muted-foreground mt-1">
                {customerName}
              </Text>
            )}
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

        {/* Items */}
        <View className="bg-background p-4 rounded-[16px] mb-4">
          {items.map((item, idx) => (
            <View
              key={idx}
              className={`flex-row justify-between items-center ${idx !== items.length - 1 ? "mb-2" : ""}`}
            >
              <Text
                className="text-[14px] font-body font-medium text-muted-foreground flex-1"
                numberOfLines={1}
              >
                {item.qty}x {item.name}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View className="flex-row justify-between items-center pt-2">
          <View>
            <Text className="text-caption font-body text-muted-foreground mb-0.5">
              Total Amount
            </Text>
            <Text className="text-[16px] font-heading font-black text-primary">
              GHS {total.toFixed(2)}
            </Text>
          </View>

          {actionLabel && onActionPress && (
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className="bg-primary-subtle px-5 py-2.5 rounded-full"
              onPress={onActionPress}
            >
              <Text className="text-[14px] font-bold text-primary">{actionLabel}</Text>
            </Pressable>
          )}
        </View>
      </Card>
    </Pressable>
  );
}
