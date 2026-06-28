import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Alert, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVendorOrder, useUpdateOrderStatus } from "@/lib/hooks/use-vendor";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { DetailSkeleton } from "@/components/ui/Skeleton";

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: order, isLoading } = useVendorOrder(id || "");
  const updateStatus = useUpdateOrderStatus();

  const handleAction = (newStatus: string) => {
    updateStatus.mutate(
      { id: id || "", status: newStatus },
      {
        onSuccess: () => {
          Alert.alert("Status Updated", `Order status changed to ${newStatus}.`);
        },
        onError: () => Alert.alert("Error", "Failed to update order status."),
      }
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <DetailSkeleton />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-body-lg text-muted-foreground">Order not found.</Text>
      </View>
    );
  }

  const renderActionButtons = () => {
    if (order.status === "New") {
      return (
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => handleAction("cancelled")}
            className="flex-1 py-4 items-center rounded-full bg-rose-50 border border-rose-100"
          >
            <Text className="text-body-lg font-bold text-error">Reject</Text>
          </Pressable>
          <View className="flex-1">
            <Button
              title="Accept Order"
              size="lg"
              loading={updateStatus.isPending}
              onPress={() => handleAction("processing")}
              className="w-full"
            />
          </View>
        </View>
      );
    }

    if (order.status === "Processing") {
      return (
        <Button
          title="Mark as Ready"
          size="lg"
          loading={updateStatus.isPending}
          onPress={() => handleAction("ready")}
          className="w-full"
        />
      );
    }

    if (order.status === "Ready") {
      return (
        <View className="gap-3">
          <Button
            title="Request BexieMart Rider"
            size="lg"
            loading={updateStatus.isPending}
            onPress={() => handleAction("rider_requested")}
            className="w-full bg-primary"
          />
          <Pressable
            onPress={() => handleAction("completed")}
            className="w-full py-4 items-center rounded-full border border-border bg-card"
          >
            <Text className="text-body-lg font-bold text-muted-foreground">
              Mark as Completed (Self-Delivery)
            </Text>
          </Pressable>
        </View>
      );
    }

    return null;
  };

  return (
    <View className="flex-1 bg-background">
      {/* Custom Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center justify-between"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row items-center">
          <BackButton
            className="w-10 h-10 rounded-full bg-background items-center justify-center mr-3"
            color="#0f172a"
          />
          <View>
            <Text className="text-body-md text-muted-foreground font-bold mb-0.5">
              Order Details
            </Text>
            <Text className="text-heading-md font-heading font-black text-foreground leading-tight">
              {order.id}
            </Text>
          </View>
        </View>
        <View className="px-3 py-1 rounded-full bg-blue-100">
          <Text className="text-body-sm font-bold text-blue-700">{order.status.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="pb-12 pt-6 gap-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Info */}
        <View className="bg-card rounded-2xl border border-border p-5">
          <Text className="text-body-lg font-bold text-foreground mb-4">Customer Info</Text>
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 rounded-full bg-muted items-center justify-center mr-3">
              <Icon name="user" size={20} color="#64748b" />
            </View>
            <View className="flex-1">
              <Text className="text-body-lg font-bold text-foreground">{order.customer.name}</Text>
              <Text className="text-body-md text-muted-foreground mt-0.5">
                {order.customer.phone}
              </Text>
            </View>
            <Pressable className="w-10 h-10 rounded-full bg-green-50 items-center justify-center">
              <Icon name="phone" size={18} color="#16a34a" />
            </Pressable>
          </View>

          <View className="bg-background rounded-lg p-3 flex-row items-start">
            <Icon
              name="map-pin"
              size={16}
              color="#64748b"
              style={{ marginTop: 2, marginRight: 8 }}
            />
            <View className="flex-1">
              <Text className="text-sm font-bold text-muted-foreground mb-0.5">{order.type}</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed">
                {order.customer.address}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View className="bg-card rounded-2xl border border-border p-5">
          <Text className="text-body-lg font-bold text-foreground mb-4">Order Items</Text>

          <View className="gap-4 mb-4">
            {order.items.map((item: any, index: number) => (
              <View
                key={item.id}
                className={`flex-row justify-between ${index < order.items.length - 1 ? "pb-4 border-b border-border" : ""}`}
              >
                <View className="flex-row items-start flex-1 pr-4">
                  <View className="w-6 h-6 rounded bg-muted items-center justify-center mr-3 mt-0.5">
                    <Text className="text-body-sm font-bold text-muted-foreground">
                      {item.quantity}x
                    </Text>
                  </View>
                  <Text className="text-body-lg font-medium text-foreground">{item.name}</Text>
                </View>
                <Text className="text-body-lg font-bold text-foreground">
                  GHS {(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          <View className="border-t border-border pt-4 gap-2">
            <View className="flex-row justify-between">
              <Text className="text-body-md text-muted-foreground">Subtotal</Text>
              <Text className="text-body-md text-foreground">GHS {order.subtotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-body-md text-muted-foreground">Delivery Fee</Text>
              <Text className="text-body-md text-foreground">
                GHS {order.deliveryFee.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between mt-2 pt-2 border-t border-border">
              <Text className="text-body-lg font-bold text-foreground">Total</Text>
              <Text className="text-heading-md font-black text-primary">
                GHS {order.total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="mt-2 pb-6">{renderActionButtons()}</View>
      </ScrollView>
    </View>
  );
}
