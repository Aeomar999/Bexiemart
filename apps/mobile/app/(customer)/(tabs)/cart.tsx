import { View, Text, ScrollView, Alert, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart, useUpdateCartItem, useRemoveFromCart } from "@/lib/hooks/use-cart";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Image } from "expo-image";
import { Icon } from "@/components/ui/Icon";
import { useState } from "react";
import Toast from "@/lib/toast-polyfill";

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: cartData, isLoading } = useCart();
  const updateCartMutation = useUpdateCartItem();
  const removeFromCartMutation = useRemoveFromCart();

  const items = cartData?.items ?? [];
  const itemCount = items.reduce((sum: number, i: { price: number; quantity: number }) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity, 0);

  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  const deliveryFee = items.length > 0 ? 5.00 : 0;
  const discount = couponApplied ? subtotal * 0.1 : 0;
  const total = subtotal + deliveryFee - discount;

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      Toast.show({ type: "error", text1: "Enter Code", text2: "Please enter a coupon code." });
      return;
    }
    if (couponCode.toUpperCase() === "BEXIE10") {
      setCouponApplied(true);
      Toast.show({ type: "success", text1: "Applied", text2: "10% discount applied!" });
    } else {
      Toast.show({ type: "error", text1: "Invalid", text2: "Coupon code not recognized." });
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setCouponCode("");
  };

  const handleRemoveItem = (productId: string, name: string) => {
    const cartItem = items.find((i: any) => i.productId === productId);
    Alert.alert("Remove Item", `Remove "${name}" from cart?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => {
        if (cartItem) removeFromCartMutation.mutate({ itemId: cartItem.id, productId });
        Toast.show({ type: "info", text1: "Item Removed", text2: `${name} was removed.` });
      } },
    ]);
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    router.push("/(customer)/checkout");
  };

  if (items.length === 0) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <EmptyState
          icon="shopping-bag"
          title="Your cart is empty"
          description="Explore the marketplace and add items you love to your cart."
          actionLabel="Browse Products"
          onAction={() => router.push("/(customer)/(shop)")}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        contentContainerClassName="px-5 pt-4 pb-72"
        showsVerticalScrollIndicator={false}
      >
        {/* Fake grouping for UI demo */}
        {[
          { vendor: "TechHub Ghana", items: items.slice(0, Math.max(1, Math.ceil(items.length / 2))) },
          { vendor: "StylePlug", items: items.slice(Math.max(1, Math.ceil(items.length / 2))) }
        ].filter(g => g.items.length > 0).map((group, gIdx) => (
          <View key={gIdx} className="mb-6">
            {/* Vendor Header */}
            <View className="flex-row items-center justify-between mb-3 px-1">
              <View className="flex-row items-center gap-2">
                <View className="w-5 h-5 rounded bg-brand-600 items-center justify-center">
                  <Icon name="check" size={14} color="#fff" />
                </View>
                <Icon name="store" size={16} color="#475569" />
                <Text className="text-[16px] font-heading font-bold text-foreground">{group.vendor}</Text>
              </View>
              <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]} onPress={() => router.push("/(customer)/(shop)")}>
                <Text className="text-[12px] font-bold text-brand-600">Visit Store</Text>
              </Pressable>
            </View>

            {/* Items */}
            {group.items.map((item: any, idx: number) => (
              <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                key={item.productId}
                className="flex-row bg-card rounded-[24px] p-4 border border-border gap-4 mb-3 shadow-[0_4px_10px_rgba(0,0,0,0.02)]"
                
                onPress={() => router.push(`/(customer)/product/${item.productId}`)}
              >
                <View className="flex-row items-center mr-2">
                  <View className="w-5 h-5 rounded border border-surface-300 items-center justify-center">
                    <View className="w-3 h-3 rounded-sm bg-brand-600" />
                  </View>
                </View>

                <View className="w-[84px] h-[84px] rounded-[16px] bg-background items-center justify-center overflow-hidden border border-border">
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} className="w-full h-full" contentFit="cover" />
                  ) : (
                    <Icon name="image" size={24} color="#cbd5e1" />
                  )}
                </View>

                <View className="flex-1 justify-between">
                  <View className="flex-row justify-between items-start">
                    <Text className="text-body-md font-semibold text-foreground font-body flex-1 mr-2" numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      className="w-8 h-8 rounded-full bg-rose-50 items-center justify-center"
                      onPress={() => handleRemoveItem(item.productId, item.name)}
                    >
                      <Icon name="trash-2" size={15} color="#f43f5e" />
                    </Pressable>
                  </View>

                  <View className="flex-row items-center justify-between mt-2">
                    <View>
                      <Text className="text-[16px] font-black text-brand-600 font-heading">
                        GHS {item.price.toFixed(2)}
                      </Text>
                      {item.stock <= 5 && (
                        <Text className="text-[10px] text-amber-600 font-body mt-0.5">
                          Only {item.stock} left
                        </Text>
                      )}
                    </View>

                    <View className="flex-row items-center bg-background rounded-full border border-border">
                      <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                        className="w-8 h-8 items-center justify-center"
                        onPress={() => updateCartMutation.mutate({ itemId: item.id, productId: item.productId, quantity: item.quantity - 1 })}
                        disabled={item.quantity <= 1}
                      >
                        <Icon name="minus" size={14} color={item.quantity <= 1 ? "#cbd5e1" : "#475569"} />
                      </Pressable>
                      <Text className="text-[14px] font-bold text-foreground font-body w-6 text-center">
                        {item.quantity}
                      </Text>
                      <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                        className="w-8 h-8 items-center justify-center"
                        onPress={() => updateCartMutation.mutate({ itemId: item.id, productId: item.productId, quantity: item.quantity + 1 })}
                        disabled={item.quantity >= item.stock}
                      >
                        <Icon name="plus" size={14} color={item.quantity >= item.stock ? "#cbd5e1" : "#475569"} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Bottom Checkout Bar */}
      <View className="absolute bottom-0 left-0 right-0">
        <BlurView intensity={90} tint="light" className="px-5 py-5 rounded-t-[32px] border-t border-border/50 shadow-2xl">
          {/* Coupon Section */}
          {!couponApplied ? (
            <View className="flex-row gap-2 mb-4">
                <View className="flex-1 flex-row items-center gap-2 bg-background rounded-full px-4 h-11 border border-border">
                  <Icon name="ticket-percent" size={16} color="#94a3b8" />
                  <TextInput
                    className="flex-1 font-body text-body-sm text-foreground"
                    placeholder="Enter coupon code"
                    placeholderTextColor="#94a3b8"
                    value={couponCode}
                    onChangeText={setCouponCode}
                  />
                </View>
              <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="bg-brand-600 rounded-full px-5 h-11 items-center justify-center active:scale-95"
                onPress={handleApplyCoupon}
              >
                <Text className="text-body-sm font-bold text-white font-body">Apply</Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row items-center justify-between bg-emerald-50 rounded-[16px] px-5 py-4 mb-5 border border-emerald-100">
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-emerald-500 items-center justify-center">
                  <Icon name="ticket-percent" size={16} color="#fff" />
                </View>
                <View>
                  <Text className="text-body-sm font-bold text-emerald-700 font-body">CAMPUS10 applied</Text>
                  <Text className="text-caption text-emerald-600 font-body">10% off your order</Text>
                </View>
              </View>
              <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]} onPress={handleRemoveCoupon}>
                <Text className="text-body-sm font-bold text-rose-600 font-body">Remove</Text>
              </Pressable>
            </View>
          )}

          {/* Price Breakdown */}
          <View className="gap-2 mb-4">
            <View className="flex-row justify-between">
              <Text className="text-body-sm text-muted-foreground font-body">Subtotal ({itemCount} items)</Text>
              <Text className="text-body-sm font-semibold text-foreground font-body">GHS {subtotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-body-sm text-muted-foreground font-body">Delivery fee</Text>
              <Text className="text-body-sm font-medium text-muted-foreground font-body">Calculated at checkout</Text>
            </View>
            {couponApplied && (
              <View className="flex-row justify-between">
                <Text className="text-body-sm text-emerald-600 font-body">Discount (10%)</Text>
                <Text className="text-body-sm font-semibold text-emerald-600 font-body">- GHS {discount.toFixed(2)}</Text>
              </View>
            )}
            <View className="flex-row justify-between pt-3 border-t border-border/50">
              <Text className="text-body-lg font-bold text-foreground font-heading">Total</Text>
              <Text className="text-display-sm font-bold text-brand-600 font-heading">GHS {total.toFixed(2)}</Text>
            </View>
          </View>

          <Button
            title={`Proceed to Checkout  GHS ${total.toFixed(2)}`}
            size="lg"
            onPress={handleCheckout}
            className="w-full rounded-full"
          />
        </BlurView>
      </View>
    </View>
  );
}
