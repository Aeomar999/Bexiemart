import { BackButton } from "@/components/ui/BackButton";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import {
  useFoodCart,
  useUpdateFoodCartItem,
  useRemoveFoodCartItem,
  useFoodCheckout,
} from "@/lib/hooks/use-food";
import { useAddresses } from "@/lib/hooks/use-addresses";
import { usePopupStore } from "@/lib/stores/popup-store";
import { deliveryApi } from "@/lib/api/delivery";

type Coords = { latitude: number; longitude: number };

export default function FoodCartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: cartData, isLoading } = useFoodCart();
  const { data: addressesData } = useAddresses();
  const savedAddresses = addressesData?.addresses ?? addressesData ?? [];
  const updateItemQty = useUpdateFoodCartItem();
  const removeItem = useRemoveFoodCartItem();
  const checkout = useFoodCheckout();
  const showPopup = usePopupStore((s) => s.showPopup);

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCoords, setDeliveryCoords] = useState<Coords | null>(null);
  const [selectingAddress, setSelectingAddress] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [quotingFee, setQuotingFee] = useState(false);

  const items = cartData?.items ?? [];
  const subtotal = items.reduce(
    (acc: number, item: any) => acc + Number(item.price) * item.quantity,
    0
  );
  const itemCount = items.reduce((acc: number, item: any) => acc + item.quantity, 0);

  // The restaurant pickup coordinates (null until the vendor has been geocoded).
  const vendorLat = cartData?.vendor?.latitude as number | null | undefined;
  const vendorLng = cartData?.vendor?.longitude as number | null | undefined;

  // Live-quote the delivery fee once we know both the restaurant and dropoff.
  useEffect(() => {
    if (!deliveryCoords || vendorLat == null || vendorLng == null) {
      setDeliveryFee(null);
      return;
    }
    let cancelled = false;
    setQuotingFee(true);
    deliveryApi
      .quoteAll({
        pickupLat: vendorLat,
        pickupLng: vendorLng,
        dropoffLat: deliveryCoords.latitude,
        dropoffLng: deliveryCoords.longitude,
      })
      .then(({ data }) => {
        if (cancelled) return;
        // Food orders default to a bike rider on the server.
        const bike = data.find((q) => q.vehicleType === "bike") ?? data[0];
        setDeliveryFee(bike ? bike.customerFee : null);
      })
      .catch(() => !cancelled && setDeliveryFee(null))
      .finally(() => !cancelled && setQuotingFee(false));
    return () => {
      cancelled = true;
    };
  }, [deliveryCoords, vendorLat, vendorLng]);

  const geocode = async (address: string): Promise<Coords | null> => {
    try {
      const [res] = await Location.geocodeAsync(address);
      return res ? { latitude: res.latitude, longitude: res.longitude } : null;
    } catch {
      return null;
    }
  };

  const selectAddress = async (label: string) => {
    setDeliveryAddress(label);
    setSelectingAddress(false);
    const coords = await geocode(label);
    setDeliveryCoords(coords);
    if (!coords) {
      showPopup({
        type: "error",
        title: "Address not found",
        message: "We couldn't locate that address. Try a more specific one.",
      });
    }
  };

  const useCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showPopup({
          type: "error",
          title: "Permission denied",
          message: "We need location permission to deliver to you.",
        });
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      const [addr] = await Location.reverseGeocodeAsync(coords);
      const label = addr
        ? [addr.streetNumber, addr.street, addr.city].filter(Boolean).join(" ")
        : "Current Location";
      setDeliveryAddress(label || "Current Location");
      setDeliveryCoords(coords);
      setSelectingAddress(false);
    } catch {
      showPopup({
        type: "error",
        title: "Location Error",
        message: "Could not fetch your current location.",
      });
    } finally {
      setIsLocating(false);
    }
  };

  const handleCheckout = () => {
    if (!deliveryCoords) {
      showPopup({
        type: "error",
        title: "Delivery address needed",
        message: "Please choose where your order should be delivered.",
      });
      return;
    }
    checkout
      .mutateAsync({
        deliveryAddress,
        deliveryLat: deliveryCoords.latitude,
        deliveryLng: deliveryCoords.longitude,
        vehicleType: "bike",
      })
      .then(() => {
        showPopup({
          type: "success",
          title: "Order Placed!",
          message: "Your food is being prepared and a rider is being assigned.",
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
          <View className="w-24 h-24 bg-secondary rounded-full items-center justify-center mb-4">
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
            className="bg-primary px-8 py-4 rounded-full"
            onPress={() => router.back()}
          >
            <Text className="text-white font-bold text-[16px]">Browse Restaurants</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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
            Order from <Text className="text-primary">{restaurantName}</Text>
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
                    <Text className="text-[15px] font-bold text-primary">
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

        {/* Delivery Address */}
        <View className="px-5 mt-6">
          <Text className="text-[16px] font-bold text-foreground mb-3 font-heading">
            Delivery Address
          </Text>
          <Pressable
            onPress={() => setSelectingAddress(true)}
            className="bg-card rounded-[24px] p-4 border border-border flex-row items-center gap-3"
          >
            <View className="w-10 h-10 rounded-full bg-primary-subtle items-center justify-center border border-border">
              <Icon name="map-pin" size={18} color="var(--color-primary)" />
            </View>
            <View className="flex-1">
              {deliveryAddress ? (
                <Text className="text-[15px] font-bold text-foreground" numberOfLines={1}>
                  {deliveryAddress}
                </Text>
              ) : (
                <Text className="text-[15px] text-muted-foreground">
                  Tap to choose where to deliver
                </Text>
              )}
            </View>
            <Icon name="chevron-right" size={18} color="#94a3b8" />
          </Pressable>
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
                {quotingFee
                  ? "Calculating..."
                  : deliveryFee != null
                    ? `GHS ${deliveryFee.toFixed(2)}`
                    : deliveryCoords
                      ? "Calculated at checkout"
                      : "Select address"}
              </Text>
            </View>

            <View className="h-[1px] bg-muted mb-4" />

            <View className="flex-row justify-between items-center">
              <Text className="text-[16px] font-bold text-foreground">Total</Text>
              <Text className="text-[20px] font-black text-primary">
                GHS {(subtotal + (deliveryFee ?? 0)).toFixed(2)}
              </Text>
            </View>
            {deliveryFee == null && (
              <Text className="text-[12px] text-muted-foreground mt-1">
                Delivery fee is added based on distance to your address.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Checkout Footer */}
      <View className="absolute bottom-0 left-0 right-0 bg-card border-t border-border p-4 pb-8">
        <Button
          title={deliveryCoords ? "Place Food Order" : "Select Delivery Address"}
          size="lg"
          className="w-full rounded-full"
          loading={checkout.isPending}
          disabled={!deliveryCoords}
          onPress={handleCheckout}
        />
      </View>

      {/* Address Selection Modal */}
      <Modal visible={selectingAddress} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View
            className="bg-card rounded-t-[32px] p-6 h-2/3"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-[20px] font-bold font-heading text-foreground">
                Delivery Location
              </Text>
              <Pressable
                onPress={() => setSelectingAddress(false)}
                className="p-2 bg-muted rounded-full"
              >
                <Icon name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                className="flex-row items-center gap-4 py-4 border-b border-border mb-2"
                onPress={useCurrentLocation}
                disabled={isLocating}
              >
                <View className="w-10 h-10 rounded-full bg-primary-subtle items-center justify-center border border-border">
                  {isLocating ? (
                    <ActivityIndicator size="small" color="var(--color-primary)" />
                  ) : (
                    <Icon name="navigation" size={18} color="var(--color-primary)" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] font-bold text-primary font-heading">
                    Use Current Location
                  </Text>
                  <Text className="text-[13px] text-muted-foreground mt-1">
                    Deliver to where you are now
                  </Text>
                </View>
              </TouchableOpacity>

              <Text className="text-[14px] font-bold text-muted-foreground mb-3">
                Saved Addresses
              </Text>
              {savedAddresses.map((addr: any) => (
                <TouchableOpacity
                  key={addr.id}
                  className="flex-row items-center gap-4 py-4 border-b border-border"
                  onPress={() => selectAddress(`${addr.address}, ${addr.city}`)}
                >
                  <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
                    <Icon
                      name={
                        addr.type === "Home"
                          ? "home"
                          : addr.type === "Office"
                            ? "briefcase"
                            : "map-pin"
                      }
                      size={18}
                      color="#64748b"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] font-bold text-foreground">{addr.type}</Text>
                    <Text className="text-[13px] text-muted-foreground mt-1">
                      {addr.address}, {addr.city}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              <View className="mt-8 pt-4 border-t border-border">
                <Text className="text-[14px] font-bold text-muted-foreground mb-3">
                  Or enter manually
                </Text>
                <TextInput
                  className="bg-background border border-border rounded-[16px] px-4 h-12 font-body text-[15px]"
                  placeholder="Type your delivery address..."
                  onSubmitEditing={(e) => selectAddress(e.nativeEvent.text)}
                  returnKeyType="search"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
