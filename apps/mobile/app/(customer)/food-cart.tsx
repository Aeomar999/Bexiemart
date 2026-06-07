import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import {
  useFoodCart,
  useClearFoodCart,
  useUpdateFoodCartItem,
  useRemoveFoodCartItem,
  useFoodCheckout,
} from "@/lib/hooks/use-food";
import { usePopupStore } from "@/lib/stores/popup-store";

export default function FoodCartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: cartData, isLoading } = useFoodCart();
  const updateItemQty = useUpdateFoodCartItem();
  const removeItem = useRemoveFoodCartItem();
  const clearCart = useClearFoodCart();
  const checkout = useFoodCheckout();
  const showPopup = usePopupStore((s) => s.showPopup);

  const items = cartData?.items ?? [];
  const subtotal = items.reduce(
    (acc: number, item: any) => acc + Number(item.price) * item.quantity,
    0
  );
  const itemCount = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
  const deliveryFee = items.length > 0 ? 15 : 0;
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    checkout
      .mutateAsync()
      .then(() => {
        showPopup({
          type: "success",
          title: "Order Placed!",
          message: "Your food is being prepared and will be delivered soon.",
        });
        router.replace("/(customer)/food");
      })
      .catch(() => {
        showPopup({
          type: "error",
          title: "Order Failed",
          message: "Could not place your order. Please try again.",
        });
      });
  };

  const handleUpdateQty = (itemId: string, qty: number) => {
    if (qty < 1) {
      removeItem.mutate(itemId);
    } else {
      updateItemQty.mutate({ id: itemId, quantity: qty });
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ListSkeleton />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <View
          className="px-5 pb-4 bg-card border-b border-border"
          style={{ paddingTop: (insets.top || 12) + 12 }}
        >
          <View className="flex-row items-center gap-3">
            <BackButton />
            <Text className="text-[20px] font-heading font-black text-foreground">Food Cart</Text>
          </View>
        </View>
        <View className="flex-1 items-center justify-center p-5">
          <View className="w-24 h-24 bg-accent rounded-full items-center justify-center mb-4">
            <Icon name="shopping-bag" size={40} color="#94a3b8" />
          </View>
          <Text className="text-[20px] font-heading font-bold text-foreground mb-2">
            Your cart is empty
          </Text>
          <Text className="text-[14px] font-body text-muted-foreground text-center mb-6">
            Looks like you haven't added any food yet.
          </Text>
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="bg-brand-600 px-8 py-4 rounded-full"
            onPress={() => router.back()}
          >
            <Text className="text-white font-bold text-[16px]">Browse Restaurants</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Group items by restaurant for a better UI
  const restaurantName = items[0]?.foodItem?.vendor?.shopName ?? items[0]?.name ?? "Restaurant";

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pb-4 bg-card border-b border-border z-10"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-[20px] font-heading font-black text-foreground">
            Food Cart ({itemCount})
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="px-5 pt-6 pb-2">
          <Text className="text-[16px] font-bold text-foreground mb-4">
            Order from <Text className="text-brand-600">{restaurantName}</Text>
          </Text>

          <View className="bg-card rounded-[24px] border border-border overflow-hidden">
            {items.map((item: any, index: number) => (
              <View
                key={item.id}
                className={`p-4 ${index !== items.length - 1 ? "border-b border-border" : ""}`}
              >
                <View className="flex-row justify-between mb-3">
                  <View className="flex-1 pr-4">
                    <Text className="text-[16px] font-bold text-foreground mb-1">
                      {item.foodItem?.name ?? item.name}
                    </Text>
                    <Text className="text-[15px] font-bold text-brand-600">
                      GHS {Number(item.price).toFixed(2)}
                    </Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
                    onPress={() => removeItem.mutate(item.id)}
                    className="p-2"
                  >
                    <Icon name="trash-2" size={18} color="#ef4444" />
                  </Pressable>
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center bg-background rounded-full border border-border">
                    <Pressable
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      className="w-10 h-10 items-center justify-center"
                      onPress={() => handleUpdateQty(item.id, item.quantity - 1)}
                    >
                      <Icon
                        name="minus"
                        size={16}
                        color={item.quantity <= 1 ? "#cbd5e1" : "#475569"}
                      />
                    </Pressable>
                    <Text className="text-[15px] font-bold text-foreground w-6 text-center">
                      {item.quantity}
                    </Text>
                    <Pressable
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      className="w-10 h-10 items-center justify-center"
                      onPress={() => handleUpdateQty(item.id, item.quantity + 1)}
                    >
                      <Icon name="plus" size={16} color="#475569" />
                    </Pressable>
                  </View>
                  <Text className="text-[15px] font-bold text-foreground">
                    GHS {(Number(item.price) * item.quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="px-5 mt-6">
          <View className="bg-card rounded-[24px] p-5 border border-border">
            <Text className="text-[16px] font-bold text-foreground mb-4 font-heading">
              Order Summary
            </Text>

            <View className="flex-row justify-between mb-3">
              <Text className="text-[14px] text-muted-foreground">Subtotal</Text>
              <Text className="text-[14px] font-bold text-foreground">
                GHS {subtotal.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-4">
              <Text className="text-[14px] text-muted-foreground">Delivery Fee</Text>
              <Text className="text-[14px] font-bold text-foreground">
                GHS {deliveryFee.toFixed(2)}
              </Text>
            </View>

            <View className="h-[1px] bg-muted mb-4" />

            <View className="flex-row justify-between items-center">
              <Text className="text-[16px] font-bold text-foreground">Total</Text>
              <Text className="text-[20px] font-black text-brand-600">GHS {total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Footer */}
      <View className="absolute bottom-0 left-0 right-0 bg-card border-t border-border p-4 pb-8">
        <Button
          title="Place Food Order"
          size="lg"
          className="w-full rounded-full"
          loading={checkout.isPending}
          onPress={handleCheckout}
        />
      </View>
    </View>
  );
}
