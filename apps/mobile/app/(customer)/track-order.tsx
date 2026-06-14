import { View, Text, Pressable, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "@/components/ui/BackButton";
import { Icon } from "@/components/ui/Icon";
import { useRiderStore } from "@/lib/stores/rider-store";
import { usePopupStore } from "@/lib/stores/popup-store";
import { useEffect, useState, useRef } from "react";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { darkMapStyle } from "@/lib/constants/map-style";

export default function TrackOrderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { activeRide, updateStatus, cancelRide } = useRiderStore();
  const showPopup = usePopupStore((s) => s.showPopup);

  const [timeRemaining, setTimeRemaining] = useState(14);
  const mapRef = useRef<MapView>(null);

  // Starting Coordinates
  const dropoffCoords = { latitude: 5.6037, longitude: -0.187 };
  const [riderCoords, setRiderCoords] = useState({ latitude: 5.6145, longitude: -0.2057 });

  // Simulation effect for a live tracking feel
  useEffect(() => {
    if (!activeRide) return;

    let timer: number;

    if (activeRide.status === "searching") {
      timer = setTimeout(() => {
        updateStatus("on_the_way", {
          driverName: "Kwame Osei",
          driverVehicle: `Honda ${activeRide.riderType} • GW-4521`,
          driverRating: 4.9,
        });
        showPopup({
          type: "success",
          title: "Rider Found",
          message: `${activeRide.riderType} driver Kwame Osei is on the way!`,
        });
      }, 5000);
    } else if (activeRide.status === "on_the_way") {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });

        // Move rider slightly closer to dropoff
        setRiderCoords((prevCoords) => {
          const newCoords = {
            latitude: prevCoords.latitude + (dropoffCoords.latitude - prevCoords.latitude) * 0.1,
            longitude:
              prevCoords.longitude + (dropoffCoords.longitude - prevCoords.longitude) * 0.1,
          };
          // Animate map camera to keep both in view
          mapRef.current?.animateToRegion(
            {
              latitude: (newCoords.latitude + dropoffCoords.latitude) / 2,
              longitude: (newCoords.longitude + dropoffCoords.longitude) / 2,
              latitudeDelta: Math.abs(newCoords.latitude - dropoffCoords.latitude) * 2 + 0.01,
              longitudeDelta: Math.abs(newCoords.longitude - dropoffCoords.longitude) * 2 + 0.01,
            },
            1000
          );
          return newCoords;
        });
      }, 5000); // decrement every 5 seconds for fast demo
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeRide?.status]);

  // Watch for time remaining to arrive
  useEffect(() => {
    if (activeRide?.status === "on_the_way" && timeRemaining <= 0) {
      updateStatus("arrived");
      showPopup({ type: "success", title: "Rider Arrived", message: "Your rider is outside!" });
    }
  }, [timeRemaining, activeRide?.status]);

  if (!activeRide) {
    return (
      <View className="flex-1 bg-background">
        <View
          className="px-5 pt-4 pb-4 bg-card border-b border-border"
          style={{ paddingTop: insets.top + 12 }}
        >
          <View className="flex-row items-center gap-3">
            <BackButton />
            <Text className="text-[20px] font-heading font-black text-foreground">Track Order</Text>
          </View>
        </View>
        <View className="flex-1 items-center justify-center p-5">
          <View className="w-20 h-20 bg-secondary rounded-full items-center justify-center mb-6">
            <Icon name="truck" size={32} color="#94a3b8" />
          </View>
          <Text className="text-[20px] font-heading font-black text-foreground mb-2">
            No Active Ride
          </Text>
          <Text className="text-[15px] font-body text-muted-foreground text-center mb-8">
            You don't have any active deliveries or rides currently in progress.
          </Text>

          <Pressable
            className="bg-primary px-6 py-3 rounded-full"
            onPress={() => router.replace("/(customer)/book-rider")}
          >
            <Text className="text-white font-bold text-[16px]">Book a Rider</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const handleCancel = () => {
    cancelRide();
    showPopup({
      type: "error",
      title: "Ride Cancelled",
      message: "Your request was cancelled successfully.",
    });
    router.replace("/(customer)/(tabs)/(home)");
  };

  const getStatusColor = () => {
    switch (activeRide.status) {
      case "searching":
        return "bg-orange-500";
      case "on_the_way":
        return "bg-emerald-500";
      case "arrived":
        return "bg-primary";
      default:
        return "bg-background0";
    }
  };

  const getStatusText = () => {
    switch (activeRide.status) {
      case "searching":
        return "Searching...";
      case "on_the_way":
        return "On The Way";
      case "arrived":
        return "Arrived";
      default:
        return "Unknown";
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Real Map Background */}
      <MapView
        ref={mapRef}
        style={{ width: "100%", height: "100%", position: "absolute" }}
        provider={PROVIDER_DEFAULT}
        customMapStyle={darkMapStyle}
        initialRegion={{
          latitude: (riderCoords.latitude + dropoffCoords.latitude) / 2,
          longitude: (riderCoords.longitude + dropoffCoords.longitude) / 2,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Route Line */}
        {activeRide.status !== "searching" && (
          <Polyline
            coordinates={[riderCoords, dropoffCoords]}
            strokeColor="var(--color-primary)" // brand-600
            strokeWidth={4}
            lineDashPattern={[10, 10]}
          />
        )}

        {/* Drop-off Marker */}
        <Marker coordinate={dropoffCoords} anchor={{ x: 0.5, y: 0.5 }}>
          <View className="items-center">
            <View className="w-6 h-6 bg-rose-500 rounded-full items-center justify-center border-2 border-white shadow-sm">
              <View className="w-2 h-2 bg-white rounded-full" />
            </View>
            <View className="bg-white px-2 py-0.5 rounded mt-1 shadow-sm">
              <Text className="text-[10px] font-bold text-gray-900">Drop-off</Text>
            </View>
          </View>
        </Marker>

        {/* Rider Marker */}
        {activeRide.status !== "searching" && (
          <Marker coordinate={riderCoords} anchor={{ x: 0.5, y: 0.5 }}>
            <View className="items-center">
              <View className="w-10 h-10 bg-primary rounded-full items-center justify-center border-4 border-white shadow-sm">
                <Icon
                  name={
                    activeRide.riderType === "Motorbike"
                      ? "truck"
                      : activeRide.riderType === "Car"
                        ? "car"
                        : "package"
                  }
                  size={16}
                  color="#fff"
                />
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Header */}
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border z-10"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <BackButton onPress={() => router.replace("/(customer)/(tabs)/(home)")} />
            <Text className="text-[20px] font-heading font-black text-foreground">Track Order</Text>
          </View>

          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="h-10 px-4 rounded-full bg-rose-50 flex-row items-center justify-center border border-rose-200 gap-1.5"
            onPress={handleCancel}
          >
            <Icon name="x" size={14} color="#ef4444" />
            <Text className="text-[13px] font-bold text-rose-600 font-heading">Cancel</Text>
          </Pressable>
        </View>
      </View>

      {/* Bottom Tracking Sheet */}
      <View className="absolute bottom-0 left-0 right-0">
        <View
          className="bg-card rounded-t-[32px] p-6 border-t border-border shadow-sm"
          style={{ paddingBottom: Math.max(insets.bottom, 24) }}
        >
          <View className="w-12 h-1.5 bg-secondary rounded-full mx-auto mb-6" />

          {/* Status Header */}
          <View className="flex-row justify-between items-end mb-6">
            <View>
              {activeRide.status === "searching" ? (
                <Text className="text-[24px] font-heading font-black text-foreground">
                  Locating...
                </Text>
              ) : activeRide.status === "arrived" ? (
                <Text className="text-[24px] font-heading font-black text-foreground">Arrived</Text>
              ) : (
                <Text className="text-[28px] font-heading font-black text-foreground">
                  {timeRemaining} mins
                </Text>
              )}
              <Text className="text-[15px] font-body text-muted-foreground mt-1">
                {activeRide.status === "searching"
                  ? "Finding nearest rider"
                  : "Estimated arrival time"}
              </Text>
            </View>
            <View
              className={`px-3 py-1.5 rounded-md flex-row items-center gap-1.5 ${activeRide.status === "searching" ? "bg-orange-50 border border-orange-100" : "bg-emerald-50 border border-emerald-100"}`}
            >
              <View className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              <Text
                className={`text-[12px] font-bold uppercase tracking-wider ${activeRide.status === "searching" ? "text-orange-600" : "text-emerald-600"}`}
              >
                {getStatusText()}
              </Text>
            </View>
          </View>

          {/* Rider Info Card */}
          {activeRide.status !== "searching" ? (
            <View className="flex-row items-center justify-between bg-background p-4 rounded-[24px] border border-border mb-6">
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center border border-border">
                  <Icon name="user" size={24} color="#64748b" />
                </View>
                <View>
                  <Text className="text-[16px] font-bold text-foreground font-heading">
                    {activeRide.driverName}
                  </Text>
                  <Text className="text-[13px] text-muted-foreground font-body">
                    {activeRide.driverVehicle}
                  </Text>
                  <View className="flex-row items-center gap-1 mt-1">
                    <Icon name="star" size={12} color="#f59e0b" />
                    <Text className="text-[12px] font-bold text-muted-foreground">
                      {activeRide.driverRating}
                    </Text>
                  </View>
                </View>
              </View>
              <View className="flex-row gap-2">
                <Pressable
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className="w-10 h-10 rounded-full bg-primary-subtle items-center justify-center border border-border"
                  onPress={() => {
                    router.push({
                      pathname: "/(customer)/chats",
                      params: { contact: activeRide.driverName, role: "Rider" },
                    });
                  }}
                >
                  <Icon name="message-circle" size={18} color="var(--color-primary)" />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center border border-emerald-100"
                  onPress={() => {
                    Linking.openURL("tel:0541234567").catch(() =>
                      showPopup({
                        type: "error",
                        title: "Call failed",
                        message: "Phone app not available",
                      })
                    );
                  }}
                >
                  <Icon name="phone" size={18} color="#059669" />
                </Pressable>
              </View>
            </View>
          ) : (
            <View className="flex-row items-center justify-center bg-background p-6 rounded-[24px] border border-border mb-6 border-dashed">
              <Text className="text-[14px] text-muted-foreground font-body">
                Matching you with a rider nearby...
              </Text>
            </View>
          )}

          {/* Order Details Snippet */}
          <View className="flex-row items-start gap-4">
            <View className="w-12 h-12 rounded-[16px] bg-primary-subtle items-center justify-center border border-border">
              <Icon name="package" size={20} color="var(--color-primary)" />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-bold text-foreground font-heading">
                Ride {activeRide.id}
              </Text>
              <Text className="text-[13px] text-muted-foreground font-body mt-0.5">
                {activeRide.pickup} to {activeRide.dropoff}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
