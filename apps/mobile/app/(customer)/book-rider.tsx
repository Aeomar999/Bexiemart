import { tokens } from "@/theme/tokens";
import { BackButton } from "@/components/ui/BackButton";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useAddresses } from "@/lib/hooks/use-addresses";
import { usePopupStore } from "@/lib/stores/popup-store";
import { deliveryApi, DeliveryQuote, VehicleType } from "@/lib/api/delivery";

type Coords = { latitude: number; longitude: number };

const RIDER_TYPES: {
  id: VehicleType;
  label: string;
  icon: string;
  time: string;
  color: string;
}[] = [
  { id: "bike", label: "Motorbike", icon: "truck", time: "10-15 min", color: "#059669" },
  { id: "car", label: "Car", icon: "car", time: "5-10 min", color: tokens.primary },
  { id: "van", label: "Van", icon: "package", time: "15-20 min", color: "#7c3aed" },
];

export default function BookRiderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: addressesData } = useAddresses();
  const savedAddresses = addressesData?.addresses ?? addressesData ?? [];
  const showPopup = usePopupStore((s) => s.showPopup);

  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [pickupCoords, setPickupCoords] = useState<Coords | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<Coords | null>(null);
  const [selectedRider, setSelectedRider] = useState<VehicleType>("bike");
  const [selectingField, setSelectingField] = useState<"pickup" | "dropoff" | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [quotes, setQuotes] = useState<Record<VehicleType, DeliveryQuote> | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [booking, setBooking] = useState(false);

  // Re-quote whenever both endpoints are known.
  useEffect(() => {
    if (!pickupCoords || !dropoffCoords) {
      setQuotes(null);
      return;
    }
    let cancelled = false;
    setQuoting(true);
    deliveryApi
      .quoteAll({
        pickupLat: pickupCoords.latitude,
        pickupLng: pickupCoords.longitude,
        dropoffLat: dropoffCoords.latitude,
        dropoffLng: dropoffCoords.longitude,
      })
      .then(({ data }) => {
        if (cancelled) return;
        const byType = {} as Record<VehicleType, DeliveryQuote>;
        for (const q of data) byType[q.vehicleType] = q;
        setQuotes(byType);
      })
      .catch(() => {
        if (!cancelled)
          showPopup({
            type: "error",
            title: "Could not price trip",
            message: "We couldn't calculate a fare. Check the addresses and try again.",
          });
      })
      .finally(() => !cancelled && setQuoting(false));
    return () => {
      cancelled = true;
    };
  }, [pickupCoords, dropoffCoords]);

  const geocode = useCallback(async (address: string): Promise<Coords | null> => {
    try {
      const [res] = await Location.geocodeAsync(address);
      return res ? { latitude: res.latitude, longitude: res.longitude } : null;
    } catch {
      return null;
    }
  }, []);

  const applySelection = async (field: "pickup" | "dropoff", label: string) => {
    if (field === "pickup") setPickup(label);
    else setDropoff(label);
    const coords = await geocode(label);
    if (field === "pickup") setPickupCoords(coords);
    else setDropoffCoords(coords);
    if (!coords) {
      showPopup({
        type: "error",
        title: "Address not found",
        message: "We couldn't locate that address on the map. Try a more specific one.",
      });
    }
  };

  const handleSelectAddress = (addressStr: string) => {
    if (selectingField) applySelection(selectingField, addressStr);
    setSelectingField(null);
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showPopup({
          type: "error",
          title: "Permission denied",
          message: "We need location permission to find you.",
        });
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      const [address] = await Location.reverseGeocodeAsync(coords);
      const addressString = address
        ? [address.streetNumber, address.street, address.city].filter(Boolean).join(" ")
        : "Current Location";

      if (selectingField === "pickup") {
        setPickup(addressString || "Current Location");
        setPickupCoords(coords);
      } else if (selectingField === "dropoff") {
        setDropoff(addressString || "Current Location");
        setDropoffCoords(coords);
      }
      setSelectingField(null);
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

  const handleBook = async () => {
    if (!pickupCoords || !dropoffCoords) {
      showPopup({
        type: "error",
        title: "Missing locations",
        message: "Please select both pickup and drop-off locations on the map.",
      });
      return;
    }
    setBooking(true);
    try {
      const { data: job } = await deliveryApi.createJob({
        vehicleType: selectedRider,
        pickupAddress: pickup,
        pickupLat: pickupCoords.latitude,
        pickupLng: pickupCoords.longitude,
        dropoffAddress: dropoff,
        dropoffLat: dropoffCoords.latitude,
        dropoffLng: dropoffCoords.longitude,
      });
      router.replace({ pathname: "/(customer)/track-order", params: { id: job.id } });
    } catch {
      showPopup({
        type: "error",
        title: "Booking failed",
        message: "We couldn't place your request. Please try again.",
      });
    } finally {
      setBooking(false);
    }
  };

  const selectedFare = quotes?.[selectedRider]?.customerFee;

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-display-sm font-heading font-black text-foreground">
            Book a Rider
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        {/* Location Box */}
        <View className="bg-card rounded-2xl p-5 border border-border mb-6">
          <Text className="text-body-md font-bold text-muted-foreground font-heading mb-2">
            Pickup Location
          </Text>
          <Pressable
            onPress={() => setSelectingField("pickup")}
            className="flex-row items-center bg-background rounded-xl px-4 h-12 border border-border mb-4"
          >
            <Icon name="map-pin" size={16} color="#059669" />
            <Text
              className={`flex-1 ml-2 font-body text-body-lg ${pickup ? "text-foreground" : "text-muted-foreground"}`}
              numberOfLines={1}
            >
              {pickup || "Where are you?"}
            </Text>
          </Pressable>

          <Text className="text-body-md font-bold text-muted-foreground font-heading mb-2">
            Drop-off Location
          </Text>
          <Pressable
            onPress={() => setSelectingField("dropoff")}
            className="flex-row items-center bg-background rounded-xl px-4 h-12 border border-border"
          >
            <Icon name="map-pin" size={16} color="#ef4444" />
            <Text
              className={`flex-1 ml-2 font-body text-body-lg ${dropoff ? "text-foreground" : "text-muted-foreground"}`}
              numberOfLines={1}
            >
              {dropoff || "Where are you going?"}
            </Text>
          </Pressable>
        </View>

        {/* Rider Selection */}
        <Text className="text-body-lg font-bold text-foreground font-heading mb-4 px-1">
          Choose Rider Type
        </Text>
        <View className="gap-3 mb-8">
          {RIDER_TYPES.map((rider) => {
            const isSelected = selectedRider === rider.id;
            const fare = quotes?.[rider.id]?.customerFee;
            return (
              <Pressable
                key={rider.id}
                className={`flex-row items-center gap-4 p-5 rounded-2xl border ${isSelected ? "border-primary bg-primary-subtle" : "border-border bg-card"}`}
                onPress={() => setSelectedRider(rider.id)}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${rider.color}20` }}
                >
                  <Icon name={rider.icon} size={22} color={rider.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-body-lg font-bold font-body text-foreground">
                    {rider.label}
                  </Text>
                  <Text
                    className={`text-sm font-body ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                  >
                    Arrives in {rider.time}
                  </Text>
                </View>
                {quoting ? (
                  <ActivityIndicator size="small" color="#94a3b8" />
                ) : (
                  <Text
                    className={`text-body-lg font-bold font-heading ${isSelected ? "text-primary-hover" : "text-foreground"}`}
                  >
                    {fare != null ? `GHS ${fare.toFixed(2)}` : "--"}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Book Button */}
      <View
        className="px-5 py-4 bg-card border-t border-border"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          style={({ pressed }) => [{ opacity: pressed || booking ? 0.8 : 1 }]}
          className="bg-primary w-full h-14 rounded-full items-center justify-center"
          onPress={handleBook}
          disabled={booking || !quotes}
        >
          {booking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-body-lg">
              {selectedFare != null
                ? `Book ${RIDER_TYPES.find((r) => r.id === selectedRider)?.label} • GHS ${selectedFare.toFixed(2)}`
                : "Select pickup & drop-off"}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Address Selection Modal */}
      <Modal visible={!!selectingField} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View
            className="bg-card rounded-t-3xl p-6 h-2/3"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-display-sm font-bold font-heading text-foreground">
                Select {selectingField === "pickup" ? "Pickup" : "Drop-off"} Location
              </Text>
              <Pressable
                onPress={() => setSelectingField(null)}
                className="p-2 bg-muted rounded-full"
              >
                <Icon name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                className="flex-row items-center gap-4 py-4 border-b border-border mb-2"
                onPress={handleUseCurrentLocation}
                disabled={isLocating}
              >
                <View className="w-10 h-10 rounded-full bg-primary-subtle items-center justify-center border border-border">
                  {isLocating ? (
                    <ActivityIndicator size="small" color={tokens.primary} />
                  ) : (
                    <Icon name="navigation" size={18} color={tokens.primary} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-body-lg font-bold text-primary font-heading">
                    Use Current Location
                  </Text>
                  <Text className="text-sm text-muted-foreground mt-1">Get this spot from GPS</Text>
                </View>
              </TouchableOpacity>

              <Text className="text-body-md font-bold text-muted-foreground mb-3">
                Saved Addresses
              </Text>
              {savedAddresses.map((addr: any) => (
                <TouchableOpacity
                  key={addr.id}
                  className="flex-row items-center gap-4 py-4 border-b border-border"
                  onPress={() => handleSelectAddress(`${addr.address}, ${addr.city}`)}
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
                    <Text className="text-body-lg font-bold text-foreground">{addr.type}</Text>
                    <Text className="text-sm text-muted-foreground mt-1">
                      {addr.address}, {addr.city}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              <View className="mt-8 pt-4 border-t border-border">
                <Text className="text-body-md font-bold text-muted-foreground mb-3">
                  Or enter manually
                </Text>
                <TextInput
                  className="bg-background border border-border rounded-xl px-4 h-12 font-body text-body-lg"
                  placeholder="Type any address..."
                  onSubmitEditing={(e) => handleSelectAddress(e.nativeEvent.text)}
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
