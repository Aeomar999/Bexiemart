import { View, Text, Switch, Pressable, Platform, Linking } from "react-native";
import { useState, useRef, useEffect } from "react";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Icon } from "@/components/ui/Icon";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { SwipeButton } from "@/components/ui/SwipeButton";
import { darkMapStyle } from "@/lib/constants/map-style";
import { Image } from "expo-image";
import Toast from "@/lib/toast-polyfill";
import {
  useAvailableTasks,
  useMyTasks,
  useAcceptTask,
  useUpdateTaskStatus,
} from "@/lib/hooks/use-dispatcher";
import { dispatcherApi } from "@/lib/api/dispatcher";
import { deliverySocketService } from "@/lib/delivery-socket";

// Default KNUST coordinates
const defaultRegion = {
  latitude: 6.6731,
  longitude: -1.5654,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function DispatcherMap() {
  const [isOnline, setIsOnline] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  // Sync online status with backend + connect the live dispatch socket.
  useEffect(() => {
    dispatcherApi.updateStatus(isOnline ? "ONLINE" : "OFFLINE").catch(() => {});
    if (isOnline) deliverySocketService.connect();
  }, [isOnline]);

  // Request Location permissions and track location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission Denied",
          text2: "Please enable location services to use the map.",
        });
        return;
      }

      // Get initial location
      const location = await Location.getCurrentPositionAsync({});
      const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      setUserLocation(coords);

      // Center map on user
      mapRef.current?.animateToRegion(
        {
          ...coords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );

      // Track location changes
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
          timeInterval: 5000,
        },
        (newLoc) => {
          setUserLocation({ latitude: newLoc.coords.latitude, longitude: newLoc.coords.longitude });
        }
      );
    })();
  }, []);

  const { data: availableData, isLoading: loadingAvailable } = useAvailableTasks(isOnline);
  const { data: activeData, isLoading: loadingActive } = useMyTasks("active");
  const acceptTask = useAcceptTask();
  const updateStatus = useUpdateTaskStatus();

  const activeRide = activeData?.jobs?.[0];
  const availableRide = availableData?.jobs?.[0];

  let taskStatus: "idle" | "available" | "accepted" | "arrived" | "delivering" | "completed" =
    "idle";
  let displayRide = null;

  if (activeRide) {
    displayRide = activeRide;
    if (activeRide.status === "ASSIGNED" || activeRide.status === "EN_ROUTE_PICKUP")
      taskStatus = "accepted";
    if (activeRide.status === "ARRIVED_PICKUP") taskStatus = "arrived";
    if (activeRide.status === "PICKED_UP" || activeRide.status === "EN_ROUTE_DROPOFF")
      taskStatus = "delivering";
  } else if (availableRide && isOnline) {
    displayRide = availableRide;
    taskStatus = "available";
  }

  // Stream live position to the customer while on a job (and keep the
  // dispatcher's last-known location fresh for matching when idle).
  useEffect(() => {
    if (!isOnline || !userLocation) return;
    deliverySocketService.sendLocation(
      userLocation.latitude,
      userLocation.longitude,
      activeRide?.id
    );
    dispatcherApi.updateLocation(userLocation.latitude, userLocation.longitude).catch(() => {});
  }, [isOnline, userLocation?.latitude, userLocation?.longitude, activeRide?.id]);

  // Frame the route when a task is displayed
  useEffect(() => {
    if (displayRide && displayRide.pickupLat && displayRide.dropoffLat) {
      const coords = [
        { latitude: Number(displayRide.pickupLat), longitude: Number(displayRide.pickupLng) },
        { latitude: Number(displayRide.dropoffLat), longitude: Number(displayRide.dropoffLng) },
      ];
      if (userLocation && (taskStatus === "available" || taskStatus === "accepted")) {
        coords.push(userLocation);
      }

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 100, right: 50, bottom: 400, left: 50 },
          animated: true,
        });
      }, 500);
    }
  }, [displayRide?.id, taskStatus, userLocation?.latitude]);

  const handleCall = () => {
    Linking.openURL(`tel:0551234567`); // Mock customer phone
  };

  const renderRoute = () => {
    if (!displayRide || !displayRide.pickupLat) return null;

    const pickupCoords = {
      latitude: Number(displayRide.pickupLat),
      longitude: Number(displayRide.pickupLng),
    };
    const dropoffCoords = {
      latitude: Number(displayRide.dropoffLat),
      longitude: Number(displayRide.dropoffLng),
    };

    return (
      <>
        {/* Pickup Marker */}
        <Marker coordinate={pickupCoords} title="Pickup">
          <View className="w-8 h-8 bg-error rounded-full items-center justify-center border-2 border-white shadow-sm">
            <Icon name="package" size={16} color="white" />
          </View>
        </Marker>

        {/* Dropoff Marker */}
        <Marker coordinate={dropoffCoords} title="Dropoff">
          <View className="w-8 h-8 bg-emerald-500 rounded-full items-center justify-center border-2 border-white shadow-sm">
            <Icon name="map-pin" size={16} color="white" />
          </View>
        </Marker>

        {/* Route from User to Pickup (if not yet arrived) */}
        {userLocation && (taskStatus === "available" || taskStatus === "accepted") && (
          <Polyline
            coordinates={[userLocation, pickupCoords]}
            strokeColor="var(--color-primary)"
            strokeWidth={4}
            lineDashPattern={[10, 10]} // Dashed line to indicate navigating to pickup
          />
        )}

        {/* Route from Pickup to Dropoff */}
        <Polyline
          coordinates={[pickupCoords, dropoffCoords]}
          strokeColor={taskStatus === "delivering" ? "var(--color-primary)" : "#94a3b8"}
          strokeWidth={taskStatus === "delivering" ? 4 : 3}
          lineDashPattern={taskStatus === "delivering" ? undefined : [5, 5]} // Solid if delivering, dashed otherwise
        />
      </>
    );
  };

  const renderBottomSheet = () => {
    if (!isOnline && !activeRide) {
      return (
        <View
          className="absolute bottom-0 w-full bg-card rounded-t-3xl border-t border-border p-6 shadow-lg items-center"
          style={{ paddingBottom: Math.max(insets.bottom, 20) + 24 }}
        >
          <View className="w-16 h-16 bg-slate-100 rounded-full items-center justify-center mb-4">
            <Icon name="moon" size={24} color="#64748b" />
          </View>
          <Text className="text-foreground font-bold text-heading-md font-heading mb-2">
            You are offline
          </Text>
          <Text className="text-muted-foreground text-center font-body">
            Go online to start receiving ride requests and food deliveries around campus.
          </Text>
        </View>
      );
    }

    if (taskStatus === "idle") {
      return (
        <View
          className="absolute bottom-0 w-full bg-card rounded-t-3xl border-t border-border p-6 shadow-lg items-center"
          style={{ paddingBottom: Math.max(insets.bottom, 20) + 24 }}
        >
          {loadingAvailable ? (
            <ListSkeleton />
          ) : (
            <View className="w-16 h-16 bg-emerald-50 rounded-full items-center justify-center mb-4 border border-emerald-100">
              <Icon name="radio" size={24} color="#10b981" />
            </View>
          )}
          <Text className="text-foreground font-bold text-heading-md font-heading mb-2">
            Looking for tasks...
          </Text>
          <Text className="text-muted-foreground text-center font-body">
            Stay in high-demand areas (like Commercial Area) to get pings faster.
          </Text>
        </View>
      );
    }

    if (taskStatus === "available" && displayRide) {
      return (
        <View
          className="absolute bottom-0 w-full bg-card rounded-t-3xl border-t border-border shadow-lg"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        >
          <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center my-3" />
          <View className="px-5 pb-5 pt-2">
            <Text className="text-foreground font-bold text-heading-md mb-4 font-heading">
              New Task Available
            </Text>

            <View className="bg-background rounded-2xl p-4 border border-border">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <View className="bg-primary-subtle p-2 rounded-full">
                    <Icon name="package" size={16} color="var(--color-primary)" />
                  </View>
                  <Text className="font-bold text-foreground font-body">
                    {displayRide.type === "FOOD"
                      ? "Food Delivery"
                      : displayRide.type === "ORDER"
                        ? "Order Delivery"
                        : "Ride Request"}
                  </Text>
                </View>
                <Text className="font-black text-primary text-heading-md font-heading">
                  GH₵ {Number(displayRide.driverPayout).toFixed(2)}
                </Text>
              </View>

              <View className="gap-2 mb-6">
                <View className="flex-row items-center gap-3">
                  <View className="w-2 h-2 rounded-full bg-error" />
                  <Text
                    className="text-muted-foreground text-body-md font-body flex-1"
                    numberOfLines={1}
                  >
                    {displayRide.pickupAddress}
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <View className="w-2 h-2 rounded-full bg-emerald-500" />
                  <Text
                    className="text-muted-foreground text-body-md font-body flex-1"
                    numberOfLines={1}
                  >
                    {displayRide.dropoffAddress}
                  </Text>
                </View>
              </View>

              <SwipeButton
                text={acceptTask.isPending ? "Accepting..." : "Slide to Accept"}
                buttonColor="var(--color-primary)"
                onComplete={() => {
                  acceptTask.mutate(
                    { taskId: displayRide.id },
                    {
                      onSuccess: () =>
                        Toast.show({
                          type: "success",
                          text1: "Task Accepted",
                          text2: "Navigate to the pickup location.",
                        }),
                      onError: () =>
                        Toast.show({
                          type: "error",
                          text1: "Failed",
                          text2: "Someone else might have taken this task.",
                        }),
                    }
                  );
                }}
              />
            </View>
          </View>
        </View>
      );
    }

    // Active Task States (accepted, arrived, delivering)
    if (displayRide) {
      return (
        <View
          className="absolute bottom-0 w-full bg-card rounded-t-3xl border-t border-border shadow-lg"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        >
          <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center my-3" />

          <View className="px-5 pb-5 pt-2">
            {/* Customer / Vendor Info Header */}
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden items-center justify-center">
                  {displayRide.customer?.image ? (
                    <Image
                      source={{ uri: displayRide.customer.image }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : (
                    <Icon name="user" size={20} color="#94a3b8" />
                  )}
                </View>
                <View>
                  <Text className="font-bold text-body-lg text-foreground font-heading">
                    {displayRide.customer?.name || "Customer"}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Icon name="star" size={12} color="#f59e0b" />
                    <Text className="text-muted-foreground text-sm font-body">4.9</Text>
                  </View>
                </View>
              </View>
              <View className="flex-row gap-2">
                <Pressable className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center">
                  <Icon name="message-circle" size={18} color="#0f172a" />
                </Pressable>
                <Pressable
                  onPress={handleCall}
                  className="w-10 h-10 rounded-full bg-primary-subtle items-center justify-center"
                >
                  <Icon name="phone" size={18} color="var(--color-primary)" />
                </Pressable>
              </View>
            </View>

            {/* Location Info */}
            <View className="bg-background rounded-2xl p-4 border border-border mb-6">
              {taskStatus === "accepted" ? (
                <View className="flex-row items-center gap-3">
                  <View className="bg-rose-100 p-2 rounded-full">
                    <Icon name="map-pin" size={16} color="#e11d48" />
                  </View>
                  <View>
                    <Text className="text-muted-foreground text-body-sm font-body">
                      Pick up from
                    </Text>
                    <Text className="font-bold text-foreground font-body">
                      {displayRide.pickupAddress}
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="flex-row items-center gap-3">
                  <View className="bg-emerald-100 p-2 rounded-full">
                    <Icon name="navigation" size={16} color="#10b981" />
                  </View>
                  <View>
                    <Text className="text-muted-foreground text-body-sm font-body">
                      Drop off at
                    </Text>
                    <Text className="font-bold text-foreground font-body">
                      {displayRide.dropoffAddress}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            {taskStatus === "accepted" && (
              <SwipeButton
                text={updateStatus.isPending ? "Updating..." : "Slide to Arrive"}
                buttonColor="#f59e0b"
                iconName="map-pin"
                onComplete={() => {
                  updateStatus.mutate({ taskId: displayRide.id, status: "ARRIVED_PICKUP" });
                }}
              />
            )}

            {taskStatus === "arrived" && (
              <SwipeButton
                text={updateStatus.isPending ? "Updating..." : "Confirm Pickup"}
                buttonColor="#10b981"
                iconName="package"
                onComplete={() => {
                  updateStatus.mutate({
                    taskId: displayRide.id,
                    status: "PICKED_UP",
                  });
                }}
              />
            )}

            {taskStatus === "delivering" && (
              <SwipeButton
                text={updateStatus.isPending ? "Updating..." : "Slide to Deliver"}
                buttonColor="var(--color-primary)"
                iconName="check-circle"
                onComplete={() => {
                  updateStatus.mutate(
                    { taskId: displayRide.id, status: "DELIVERED" },
                    {
                      onSuccess: () =>
                        Toast.show({
                          type: "success",
                          text1: "Delivery Complete!",
                          text2: `GH₵ ${Number(displayRide.driverPayout).toFixed(2)} added to your earnings.`,
                        }),
                    }
                  );
                }}
              />
            )}
          </View>
        </View>
      );
    }
  };

  return (
    <View className="flex-1 bg-background">
      <MapView
        ref={mapRef}
        style={{ width: "100%", height: "100%", position: "absolute" }}
        provider={PROVIDER_GOOGLE}
        customMapStyle={darkMapStyle}
        initialRegion={defaultRegion}
        showsUserLocation={false} // We are rendering our own custom marker below
        showsMyLocationButton={false}
      >
        {renderRoute()}

        {/* Dispatcher (User) Marker - Always visible when online/location known */}
        {userLocation && (
          <Marker coordinate={userLocation} title="You" zIndex={999}>
            <View className="w-10 h-10 bg-primary-subtle rounded-full items-center justify-center border border-border">
              <View className="w-6 h-6 bg-primary rounded-full border-2 border-white items-center justify-center shadow-lg">
                <Icon name="truck" size={12} color="white" />
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Floating Header */}
      <View className="absolute w-full px-5 z-10" style={{ top: Math.max(insets.top, 12) + 12 }}>
        <View className="bg-card rounded-2xl p-4 flex-row items-center justify-between border border-border shadow-sm">
          <View className="flex-row items-center gap-3">
            <View
              className={`w-3 h-3 rounded-full ${isOnline ? "bg-emerald-500" : "bg-slate-400"}`}
            />
            <Text className="text-foreground font-bold text-body-lg font-heading">
              {isOnline ? "You're Online" : "You're Offline"}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={setIsOnline}
            trackColor={{ false: "#334155", true: "#10b981" }}
            thumbColor="#ffffff"
            disabled={!!activeRide} // Prevent going offline while on a task
          />
        </View>
      </View>

      {/* Re-center Map Button */}
      <Pressable
        onPress={() => {
          if (userLocation) {
            mapRef.current?.animateToRegion(
              {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              },
              500
            );
          }
        }}
        className="absolute right-5 bg-card p-3 rounded-full shadow-md border border-border"
        style={{ top: Math.max(insets.top, 12) + 90 }}
      >
        <Icon name="navigation" size={20} color="var(--color-primary)" />
      </Pressable>

      {renderBottomSheet()}
    </View>
  );
}
