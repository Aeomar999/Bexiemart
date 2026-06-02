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
import { useState } from "react";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useAddresses } from "@/lib/hooks/use-addresses";
import { useRiderStore } from "@/lib/stores/rider-store";
import { usePopupStore } from "@/lib/stores/popup-store";

const RIDER_TYPES = [
  {
    id: "bike",
    label: "Motorbike",
    icon: "truck",
    time: "10-15 min",
    price: 8.0,
    color: "#059669",
  },
  { id: "car", label: "Car", icon: "car", time: "5-10 min", price: 15.0, color: "#004CFF" },
  { id: "van", label: "Van", icon: "package", time: "15-20 min", price: 25.0, color: "#7c3aed" },
];

export default function BookRiderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: addressesData } = useAddresses();
  const savedAddresses = addressesData?.addresses ?? addressesData ?? [];
  const bookRide = useRiderStore((s) => s.bookRide);
  const showPopup = usePopupStore((s) => s.showPopup);

  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [selectedRider, setSelectedRider] = useState("bike");

  const [selectingField, setSelectingField] = useState<"pickup" | "dropoff" | null>(null);

  const handleSelectAddress = (addressStr: string) => {
    if (selectingField === "pickup") setPickup(addressStr);
    if (selectingField === "dropoff") setDropoff(addressStr);
    setSelectingField(null);
  };

  const [isLocating, setIsLocating] = useState(false);

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
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        const addressString = [address.streetNumber, address.street, address.city]
          .filter(Boolean)
          .join(" ");
        handleSelectAddress(addressString || "Current Location");
      } else {
        handleSelectAddress("Current Location");
      }
    } catch (error) {
      showPopup({
        type: "error",
        title: "Location Error",
        message: "Could not fetch your current location.",
      });
    } finally {
      setIsLocating(false);
    }
  };

  const handleBook = () => {
    if (!pickup.trim() || !dropoff.trim()) {
      showPopup({
        type: "error",
        title: "Missing locations",
        message: "Please select both pickup and drop-off locations.",
      });
      return;
    }

    const riderDetails = RIDER_TYPES.find((r) => r.id === selectedRider)!;

    bookRide({
      pickup,
      dropoff,
      riderType: riderDetails.label,
      price: riderDetails.price,
    });

    showPopup({
      type: "success",
      title: "Looking for rider",
      message: "Searching for the nearest available rider.",
    });
    router.replace("/(customer)/track-order");
  };

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-[20px] font-heading font-black text-foreground">Book a Rider</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        {/* Location Box */}
        <View className="bg-card rounded-[24px] p-5 border border-border mb-6">
          <Text className="text-[14px] font-bold text-muted-foreground font-heading mb-2">
            Pickup Location
          </Text>
          <View className="flex-row items-center bg-background rounded-[16px] px-4 h-12 border border-border mb-4">
            <Icon name="map-pin" size={16} color="#059669" />
            <TextInput
              className="flex-1 ml-2 font-body text-[15px] text-foreground"
              placeholder="Where are you?"
              placeholderTextColor="#94a3b8"
              value={pickup}
              onChangeText={setPickup}
              onFocus={() => setSelectingField("pickup")}
            />
            {pickup.length > 0 && (
              <Pressable onPress={() => setPickup("")} className="p-1">
                <Icon name="x" size={16} color="#94a3b8" />
              </Pressable>
            )}
          </View>

          <Text className="text-[14px] font-bold text-muted-foreground font-heading mb-2">
            Drop-off Location
          </Text>
          <View className="flex-row items-center bg-background rounded-[16px] px-4 h-12 border border-border">
            <Icon name="map-pin" size={16} color="#ef4444" />
            <TextInput
              className="flex-1 ml-2 font-body text-[15px] text-foreground"
              placeholder="Where are you going?"
              placeholderTextColor="#94a3b8"
              value={dropoff}
              onChangeText={setDropoff}
              onFocus={() => setSelectingField("dropoff")}
            />
            {dropoff.length > 0 && (
              <Pressable onPress={() => setDropoff("")} className="p-1">
                <Icon name="x" size={16} color="#94a3b8" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Rider Selection */}
        <Text className="text-[16px] font-bold text-foreground font-heading mb-4 px-1">
          Choose Rider Type
        </Text>
        <View className="gap-3 mb-8">
          {RIDER_TYPES.map((rider) => {
            const isSelected = selectedRider === rider.id;
            return (
              <Pressable
                key={rider.id}
                className={`flex-row items-center gap-4 p-5 rounded-[24px] border ${isSelected ? "border-brand-600 bg-brand-50" : "border-border bg-card"}`}
                onPress={() => setSelectedRider(rider.id)}
              >
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center`}
                  style={{ backgroundColor: `${rider.color}20` }}
                >
                  <Icon name={rider.icon} size={22} color={rider.color} />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-[16px] font-bold font-body ${isSelected ? "text-brand-900" : "text-foreground"}`}
                  >
                    {rider.label}
                  </Text>
                  <Text
                    className={`text-[13px] font-body ${isSelected ? "text-brand-600" : "text-muted-foreground"}`}
                  >
                    Arrives in {rider.time}
                  </Text>
                </View>
                <Text
                  className={`text-[16px] font-bold font-heading ${isSelected ? "text-brand-700" : "text-foreground"}`}
                >
                  GHS {rider.price.toFixed(2)}
                </Text>
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
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          className="bg-brand-600 w-full h-14 rounded-full items-center justify-center"
          onPress={handleBook}
        >
          <Text className="text-white font-bold text-[16px]">
            Book {RIDER_TYPES.find((r) => r.id === selectedRider)?.label}
          </Text>
        </Pressable>
      </View>

      {/* Address Selection Modal */}
      <Modal visible={!!selectingField} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View
            className="bg-card rounded-t-[32px] p-6 h-2/3"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-[20px] font-bold font-heading text-foreground">
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
              {/* Current Location Button */}
              {selectingField === "pickup" && (
                <TouchableOpacity
                  className="flex-row items-center gap-4 py-4 border-b border-border mb-2"
                  onPress={handleUseCurrentLocation}
                  disabled={isLocating}
                >
                  <View className="w-10 h-10 rounded-full bg-brand-50 items-center justify-center border border-brand-100">
                    {isLocating ? (
                      <ActivityIndicator size="small" color="#004CFF" />
                    ) : (
                      <Icon name="navigation" size={18} color="#004CFF" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] font-bold text-brand-600 font-heading">
                      Use Current Location
                    </Text>
                    <Text className="text-[13px] text-muted-foreground mt-1">
                      Get pickup spot from GPS
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              <Text className="text-[14px] font-bold text-muted-foreground mb-3">
                Saved Addresses
              </Text>
              {savedAddresses.map((addr: any) => (
                <TouchableOpacity
                  key={addr.id}
                  className="flex-row items-center gap-4 py-4 border-b border-border"
                  onPress={() =>
                    handleSelectAddress(`${addr.name} - ${addr.address}, ${addr.city}`)
                  }
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
                    <View className="flex-row items-center gap-2">
                      <Text className="text-[16px] font-bold text-foreground">{addr.type}</Text>
                      {addr.isDefault && (
                        <View className="bg-brand-100 px-2 py-0.5 rounded text-[10px]">
                          <Text className="text-brand-700 text-[10px] font-bold">Default</Text>
                        </View>
                      )}
                    </View>
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
                  placeholder="Type any address..."
                  onSubmitEditing={(e) => handleSelectAddress(e.nativeEvent.text)}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
