import { LinearGradient } from "expo-linear-gradient";
import { tokens } from "@/theme/tokens";
import { View, Text, ScrollView, Alert, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart, useUpdateCartItem, useRemoveFromCart } from "@/lib/hooks/use-cart";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Image } from "expo-image";
import { Icon } from "@/components/ui/Icon";
import { useState } from "react";
import Toast from "@/lib/toast-polyfill";
import { CartItemSkeleton, Skeleton } from "@/components/ui/Skeleton";

interface CartItemData {
  id: string;
  productId: string;
  vendorId: string;
  vendorName: string;
  price: number;
  quantity: number;
  stock: number;
  imageUrl?: string;
  name: string;
}

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: cartData, isPending, isError, refetch } = useCart();
  const updateCartMutation = useUpdateCartItem();
  const removeFromCartMutation = useRemoveFromCart();

  const items = cartData?.items ?? [];
  const itemCount = items.reduce(
    (sum: number, i: { price: number; quantity: number }) => sum + i.quantity,
    0
  );
  const subtotal = items.reduce(
    (sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity,
    0
  );

  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  const deliveryFee = items.length > 0 ? 5.0 : 0;
  const discount = couponApplied ? subtotal * 0.1 : 0;
  const total = subtotal + deliveryFee - discount;

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      Toast.show({ type: "error", text1: "Oops!", text2: "You forgot to enter a coupon code." });
      return;
    }
    if (couponCode.toUpperCase() === "BEXIE10") {
      setCouponApplied(true);
      Toast.show({ type: "success", text1: "Applied", text2: "10% discount applied!" });
    } else {
      Toast.show({
        type: "error",
        text1: "Invalid Code",
        text2: "We didn't recognize that coupon code. Please check it and try again.",
      });
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setCouponCode("");
  };

  const handleRemoveItem = (productId: string, name: string) => {
    const cartItem = items.find((i: CartItemData) => i.productId === productId);
    Alert.alert("Remove Item", `Remove "${name}" from cart?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          if (cartItem) removeFromCartMutation.mutate({ itemId: cartItem.id, productId });
          Toast.show({ type: "info", text1: "Item Removed", text2: `${name} was removed.` });
        },
      },
    ]);
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    router.push("/(customer)/checkout");
  };

  if (isPending) {
    return (
      <View className="flex-1 bg-background">
        <View
          className="px-5 pt-4 pb-4 bg-card border-b border-border"
          style={{ paddingTop: insets.top + 12 }}
        >
          <Skeleton width={120} height={24} borderRadius={4} />
        </View>
        <ScrollView
          contentContainerClassName="px-5 pt-4 pb-72"
          showsVerticalScrollIndicator={false}
        >
          {[1, 2].map((group) => (
            <View key={group} className="mb-6">
              <View className="flex-row items-center justify-between mb-3 px-1">
                <Skeleton width={140} height={20} borderRadius={4} />
              </View>
              {[1, 2].map((item) => (
                <CartItemSkeleton key={item} />
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load your cart." onRetry={refetch} />;
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <View
          className="px-5 pt-4 pb-4 bg-card border-b border-border"
          style={{ paddingTop: (insets.top || 12) + 12 }}
        >
          <Text className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-[2px]">
            Empty
          </Text>
          <Text className="text-display-md font-heading font-black text-foreground">Cart</Text>
        </View>
        <EmptyState
          title="Your cart is empty"
          description="Looks like you haven't added anything to your cart yet."
          iconName="shopping-cart"
          actionLabel="Start Shopping"
          onAction={() => router.push("/(customer)/(shop)")}
        />
      </View>
    );
  }

  type GroupedVendor = { vendorId: string; vendor: string; items: CartItemData[] };

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border flex-row items-end justify-between"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View>
          <Text className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-[2px]">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </Text>
          <Text className="text-display-md font-heading font-black text-foreground">Cart</Text>
        </View>
      </View>
      <ScrollView contentContainerClassName="px-5 pt-4 pb-40" showsVerticalScrollIndicator={false}>
        {/* Dynamic Vendor Grouping */}
        {Object.values(
          items.reduce((acc: Record<string, GroupedVendor>, item: CartItemData) => {
            if (!acc[item.vendorId]) {
              acc[item.vendorId] = { vendorId: item.vendorId, vendor: item.vendorName, items: [] };
            }
            acc[item.vendorId].items.push(item);
            return acc;
          }, {}) as Record<string, GroupedVendor>
        ).map((group: GroupedVendor, gIdx: number) => (
          <View key={gIdx} className="mb-5">
            {/* Vendor Header */}
            <View className="flex-row items-center justify-between mb-2 px-1">
              <View className="flex-row items-center gap-1.5">
                <Icon name="store" size={14} color={tokens.textSecondary} />
                <Text className="text-[12px] font-bold text-foreground uppercase tracking-[0.1em]">
                  {group.vendor}
                </Text>
              </View>
              {group.vendorId && (
                <Pressable
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => router.push(`/(customer)/store/${group.vendorId}`)}
                >
                  <Text className="text-[12px] font-bold text-primary">Visit Store</Text>
                </Pressable>
              )}
            </View>

            {/* Items */}
            {group.items.map((item: CartItemData, idx: number) => (
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                key={item.productId}
                className="flex-row bg-card rounded-[16px] p-3 border border-border gap-3 mb-2 h-[104px]"
                onPress={() => router.push(`/(customer)/product/${item.productId}`)}
              >
                <View className="w-[78px] h-[78px] rounded-xl bg-background items-center justify-center overflow-hidden border border-border">
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : (
                    <Icon name="image" size={24} color={tokens.textDisabled} />
                  )}
                </View>

                <View className="flex-1 justify-between py-0.5">
                  <View className="flex-row justify-between items-start">
                    <Text
                      className="text-[14px] font-semibold text-foreground font-body flex-1 pr-2 leading-[20px]"
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                    <Pressable
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      accessibilityRole="button"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      className="w-7 h-7 rounded-full bg-rose-50 items-center justify-center -mt-1 -mr-1"
                      onPress={() => handleRemoveItem(item.productId, item.name)}
                    >
                      <Icon name="trash-2" size={14} color={tokens.error} />
                    </Pressable>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-2">
                      <Text
                        className="text-[15px] font-extrabold text-primary tracking-[-0.02em]"
                        style={{ fontVariant: ["tabular-nums"] }}
                        numberOfLines={1}
                      >
                        GHS {item.price.toFixed(2)}
                      </Text>
                    </View>

                    <View className="flex-row items-center bg-background rounded-full border border-border">
                      <Pressable
                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        className="w-8 h-8 items-center justify-center"
                        onPress={() =>
                          updateCartMutation.mutate({
                            itemId: item.id,
                            productId: item.productId,
                            quantity: item.quantity - 1,
                          })
                        }
                        disabled={item.quantity <= 1}
                      >
                        <Icon
                          name="minus"
                          size={14}
                          color={item.quantity <= 1 ? tokens.textDisabled : tokens.textSecondary}
                        />
                      </Pressable>
                      <Text className="text-[14px] font-bold text-foreground font-body w-6 text-center">
                        {item.quantity}
                      </Text>
                      <Pressable
                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        className="w-8 h-8 items-center justify-center"
                        onPress={() =>
                          updateCartMutation.mutate({
                            itemId: item.id,
                            productId: item.productId,
                            quantity: item.quantity + 1,
                          })
                        }
                        disabled={item.quantity >= item.stock}
                      >
                        <Icon
                          name="plus"
                          size={14}
                          color={
                            item.quantity >= item.stock ? tokens.textDisabled : tokens.textSecondary
                          }
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ))}

        {/* Coupon Section Moved to Bottom of List */}
        <View className="mt-4 mb-6">
          {!couponApplied ? (
            <View className="flex-row gap-2">
              <View className="flex-1 flex-row items-center gap-2 bg-background rounded-full px-4 h-11 border border-border">
                <Icon name="ticket-percent" size={16} color={tokens.textMuted} />
                <TextInput
                  className="flex-1 font-body text-[14px] text-foreground"
                  placeholder="Enter coupon code"
                  placeholderTextColor={tokens.textMuted}
                  value={couponCode}
                  onChangeText={setCouponCode}
                />
              </View>
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="bg-primary rounded-full px-5 h-11 items-center justify-center active:scale-95"
                onPress={handleApplyCoupon}
              >
                <Text className="text-[14px] font-bold text-white font-body">Apply</Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row items-center justify-between bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-100">
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-emerald-500 items-center justify-center">
                  <Icon name="ticket-percent" size={16} color={tokens.primaryText} />
                </View>
                <View>
                  <Text className="text-[14px] font-bold text-emerald-700 font-body">
                    CAMPUS10 applied
                  </Text>
                  <Text className="text-[12px] text-emerald-600 font-body">10% off your order</Text>
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                onPress={handleRemoveCoupon}
              >
                <Text className="text-[14px] font-bold text-error font-body">Remove</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Checkout Bar */}
      <View className="absolute bottom-0 left-0 right-0 px-5 pt-4 pb-8 bg-card border-t border-border">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Text className="text-[15px] font-bold text-foreground">Total</Text>
            <Icon name="chevron-up" size={16} color={tokens.textMuted} style={{ marginLeft: 4 }} />
          </View>
          <Text className="text-[20px] font-heading font-black text-foreground">
            GH₵ {total.toFixed(2)}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
          onPress={handleCheckout}
          className="bg-primary w-full h-[52px] rounded-full items-center justify-center"
        >
          <Text className="text-[15px] font-bold text-white">Checkout</Text>
        </Pressable>
      </View>
    </View>
  );
}
