import { tokens } from "@/theme/tokens";
import {
  View,
  Text,
  Pressable,
  Platform,
  Linking,
  AppState,
  Animated,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useState, useRef, useEffect, useCallback } from "react";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { SwipeButton } from "@/components/ui/SwipeButton";
import { darkMapStyle } from "@/lib/constants/map-style";
import { Image } from "expo-image";
import Toast from "@/lib/toast-polyfill";
import {
  useDispatcherProfile,
  useSetDispatcherStatus,
  useAvailableTasks,
  useMyTasks,
  useAcceptTask,
  useUpdateTaskStatus,
  useDispatcherEarnings,
} from "@/lib/hooks/use-dispatcher";
import { useBalanceVisibility } from "@/lib/stores/balance-visibility-store";
import { displayMoney } from "@/lib/balance";
import { formatMoney } from "@/lib/money";
import { dispatcherApi } from "@/lib/api/dispatcher";
import { useNavigationApp } from "@/lib/stores/navigation-app-store";
import { getNavigationAppLabel, openDirections } from "@/lib/navigation-apps";
import { deliverySocketService } from "@/lib/delivery-socket";

// Default KNUST coordinates
const defaultRegion = {
  latitude: 6.6731,
  longitude: -1.5654,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// iOS only draws Google tiles when the build was made with a Maps key; without
// one the map is a blank grey canvas, so fall back to Apple Maps there.
const iosGoogleMapsEnabled = Constants.expoConfig?.extra?.iosGoogleMapsEnabled === true;
const mapProvider = Platform.OS === "ios" && !iosGoogleMapsEnabled ? undefined : PROVIDER_GOOGLE;

export default function DispatcherMap() {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [locationBlocked, setLocationBlocked] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const { data: earnings, isSuccess: earningsLoaded } = useDispatcherEarnings();
  const balancesHidden = useBalanceVisibility((s) => s.hidden);
  const navigationApp = useNavigationApp((s) => s.app);

  // Phones stack the tab bar under this screen and it already clears the home
  // indicator; only the tablet sidebar layout leaves the bottom inset to us.
  const bottomInset = width >= 768 ? insets.bottom : 0;

  // Online status lives on the server so it survives app restarts; the toggle
  // only flips once the change has been saved.
  const { data: profile, isPending: statusLoading } = useDispatcherProfile();
  const setStatus = useSetDispatcherStatus();
  const isOnline = profile?.status === "ONLINE" || profile?.status === "BUSY";

  const changeStatus = (next: "ONLINE" | "OFFLINE") => {
    setStatus.mutate(next, {
      onError: () =>
        Toast.show({
          type: "error",
          text1: next === "ONLINE" ? "Couldn't go online" : "Couldn't go offline",
          text2: "Check your connection and try again.",
        }),
    });
  };

  useEffect(() => {
    if (isOnline) deliverySocketService.connect();
  }, [isOnline]);

  const startTracking = useCallback(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      setUserLocation(coords);
      setLocationBlocked(false);
      mapRef.current?.animateToRegion(
        { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        1000
      );

      watchRef.current?.remove();
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
        (newLoc) => {
          setUserLocation({ latitude: newLoc.coords.latitude, longitude: newLoc.coords.longitude });
        }
      );
    } catch {
      // Permission is granted but the phone's location services are switched off.
      setLocationBlocked(true);
    }
  }, []);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync()
      .then(({ status }) => (status === "granted" ? startTracking() : setLocationBlocked(true)))
      .catch(() => setLocationBlocked(true));
    return () => watchRef.current?.remove();
  }, [startTracking]);

  // Coming back from Settings: resume tracking if location was allowed there.
  useEffect(() => {
    if (!locationBlocked) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      Location.getForegroundPermissionsAsync()
        .then(({ status }) => {
          if (status === "granted") startTracking();
        })
        // Best effort — the notice's "Turn on" button still works if this fails.
        .catch(() => {});
    });
    return () => sub.remove();
  }, [locationBlocked, startTracking]);

  const handleEnableLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted" && (await Location.hasServicesEnabledAsync())) {
      startTracking();
      return;
    }
    // Once denied, the OS won't prompt again — Settings is the only way back.
    Linking.openSettings().catch(() => {
      Toast.show({
        type: "error",
        text1: "Couldn't open Settings",
        text2: "Turn on location for Bexiemart in your phone's settings.",
      });
    });
  };

  const { data: availableData } = useAvailableTasks(isOnline);
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
    dispatcherApi.updateLocation(userLocation.latitude, userLocation.longitude).catch(() => {
      Toast.show({
        type: "error",
        text1: "Location not updating",
        text2: "Check your GPS signal and connection.",
      });
    });
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
          edgePadding: { top: 100, right: 50, bottom: sheetHeight + 40, left: 50 },
          animated: true,
        });
      }, 500);
    }
  }, [displayRide?.id, taskStatus, userLocation?.latitude]);

  const handleCall = () => {
    if (displayRide?.customer?.phoneNumber) {
      Linking.openURL(`tel:${displayRide.customer.phoneNumber}`).catch(() => {
        Toast.show({
          type: "error",
          text1: "Couldn't start the call",
          text2: "Try calling the customer manually.",
        });
      });
    }
  };

  // Hand the current leg to the rider's chosen turn-by-turn app.
  const handleNavigate = () => {
    if (!displayRide) return;
    const toPickup = taskStatus === "accepted";
    const lat = toPickup ? displayRide.pickupLat : displayRide.dropoffLat;
    const lng = toPickup ? displayRide.pickupLng : displayRide.dropoffLng;
    if (lat == null || lng == null) return;
    openDirections(navigationApp, { latitude: Number(lat), longitude: Number(lng) }).catch(() => {
      Toast.show({
        type: "error",
        text1: "Couldn't open directions",
        text2: "Please try again.",
      });
    });
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
          <View className="w-8 h-8 bg-error rounded-full items-center justify-center border-2 border-white">
            <Icon name="package" size={16} color={tokens.primaryText} />
          </View>
        </Marker>

        {/* Dropoff Marker */}
        <Marker coordinate={dropoffCoords} title="Dropoff">
          <View className="w-8 h-8 bg-emerald-500 rounded-full items-center justify-center border-2 border-white">
            <Icon name="map-pin" size={16} color={tokens.primaryText} />
          </View>
        </Marker>

        {/* Route from User to Pickup (if not yet arrived) */}
        {userLocation && (taskStatus === "available" || taskStatus === "accepted") && (
          <Polyline
            coordinates={[userLocation, pickupCoords]}
            strokeColor={tokens.primary}
            strokeWidth={4}
            lineDashPattern={[10, 10]} // Dashed line to indicate navigating to pickup
          />
        )}

        {/* Route from Pickup to Dropoff */}
        <Polyline
          coordinates={[pickupCoords, dropoffCoords]}
          strokeColor={taskStatus === "delivering" ? tokens.primary : tokens.textMuted}
          strokeWidth={taskStatus === "delivering" ? 4 : 3}
          lineDashPattern={taskStatus === "delivering" ? undefined : [5, 5]} // Solid if delivering, dashed otherwise
        />
      </>
    );
  };

  const renderBottomSheet = () => {
    if (statusLoading && !activeRide) {
      return (
        <View className="flex-row items-center justify-center gap-3 px-5 py-8">
          <ActivityIndicator color={tokens.primary} />
          <Text className="text-foreground-secondary font-body text-body-md">
            Checking your status…
          </Text>
        </View>
      );
    }

    if (!isOnline && !activeRide) {
      return (
        <View className="px-5 pt-6 pb-6 gap-5">
          <View className="flex-row items-center gap-4">
            <View className="w-12 h-12 rounded-2xl bg-muted border border-border items-center justify-center">
              <Icon name="moon" size={22} color={tokens.textSecondary} />
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-heading font-bold text-heading-md">
                {"You're offline"}
              </Text>
              <Text className="text-foreground-secondary font-body text-body-md mt-0.5">
                Go online to get ride requests and deliveries around campus.
              </Text>
            </View>
          </View>
          {locationBlocked && <LocationNotice onEnable={handleEnableLocation} />}
          <Button
            title="Go online"
            size="lg"
            loading={setStatus.isPending}
            onPress={() => changeStatus("ONLINE")}
            leftIcon={<Icon name="power" size={20} color={tokens.primaryText} />}
            accessibilityHint="Start receiving ride and delivery requests"
          />
        </View>
      );
    }

    if (taskStatus === "idle") {
      return (
        <View className="px-5 pt-6 pb-6 gap-5">
          <View className="flex-row items-center gap-4">
            <SearchingPulse />
            <View className="flex-1">
              <Text className="text-foreground font-heading font-bold text-heading-md">
                Finding tasks near you
              </Text>
              <Text className="text-foreground-secondary font-body text-body-md mt-0.5">
                Stay near busy spots like Commercial Area to get requests faster.
              </Text>
            </View>
          </View>
          {locationBlocked && <LocationNotice onEnable={handleEnableLocation} />}
          <Button
            title="Go offline"
            variant="outline"
            size="lg"
            loading={setStatus.isPending}
            onPress={() => changeStatus("OFFLINE")}
            accessibilityHint="Stop receiving new requests"
          />
        </View>
      );
    }

    if (taskStatus === "available" && displayRide) {
      return (
        <View>
          <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center my-3" />
          <View className="px-5 pb-5 pt-2">
            <View className="mb-4">
              <View className="flex-row items-end justify-between mb-1">
                <View>
                  <Text className="text-muted-foreground text-[11px] font-bold uppercase tracking-[0.1em] mb-[2px]">
                    {displayRide.type === "FOOD"
                      ? "New food delivery"
                      : displayRide.type === "ORDER"
                        ? "New order delivery"
                        : "New ride request"}
                  </Text>
                  <Text className="font-black text-foreground text-[28px] font-heading">
                    {formatMoney(Number(displayRide.driverPayout))}
                  </Text>
                </View>
                <View className="items-end pb-1.5">
                  <Text className="text-muted-foreground text-[14px] font-body font-bold">
                    2.4 km · 12 min
                  </Text>
                </View>
              </View>
            </View>

            <View className="gap-4 mb-6 mt-2">
              <View>
                <Text className="text-muted-foreground text-body-sm mb-1">Pick up</Text>
                <Text
                  className="text-foreground text-[15px] font-semibold font-body"
                  numberOfLines={1}
                >
                  {displayRide.pickupAddress}
                </Text>
              </View>
              <View>
                <Text className="text-muted-foreground text-body-sm mb-1">Drop off</Text>
                <Text
                  className="text-foreground text-[15px] font-semibold font-body"
                  numberOfLines={1}
                >
                  {displayRide.dropoffAddress}
                </Text>
              </View>
            </View>

            <SwipeButton
              text={acceptTask.isPending ? "Accepting..." : "Slide to accept"}
              buttonColor={tokens.primary}
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
      );
    }

    // Active Task States (accepted, arrived, delivering)
    if (displayRide) {
      return (
        <View>
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
                    <Icon name="user" size={20} color={tokens.textMuted} />
                  )}
                </View>
                <View>
                  <Text className="font-bold text-body-lg text-foreground font-heading">
                    {displayRide.customer?.name || "Customer"}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Icon name="star" size={12} color={tokens.warning} />
                    <Text className="text-muted-foreground text-sm font-body">4.9</Text>
                  </View>
                </View>
              </View>
              <View className="flex-row gap-2">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Message customer"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center"
                >
                  <Icon name="message-circle" size={18} color={tokens.textPrimary} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Call customer"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={handleCall}
                  disabled={!displayRide?.customer?.phoneNumber}
                  className={`w-10 h-10 rounded-full items-center justify-center ${displayRide?.customer?.phoneNumber ? "bg-primary-subtle" : "bg-muted opacity-50"}`}
                >
                  <Icon
                    name="phone"
                    size={18}
                    color={displayRide?.customer?.phoneNumber ? tokens.primary : tokens.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            {/* Location Info */}
            <View className="flex-row items-center gap-3 mb-6 mt-2">
              <View className="flex-1">
                <Text className="text-muted-foreground text-body-sm mb-1">
                  {taskStatus === "accepted" ? "Pick up from" : "Drop off at"}
                </Text>
                <Text
                  className="text-foreground text-[15px] font-semibold font-body"
                  numberOfLines={1}
                >
                  {taskStatus === "accepted"
                    ? displayRide.pickupAddress
                    : displayRide.dropoffAddress}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Navigate with ${getNavigationAppLabel(navigationApp)}`}
                onPress={handleNavigate}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="h-10 px-4 rounded-full bg-primary-subtle flex-row items-center gap-2"
              >
                <Icon name="navigation" size={16} color={tokens.primary} />
                <Text className="text-[14px] font-bold text-primary">Navigate</Text>
              </Pressable>
            </View>

            {/* Action Buttons */}
            {taskStatus === "accepted" && (
              <SwipeButton
                text={updateStatus.isPending ? "Updating..." : "Slide to arrive"}
                buttonColor={tokens.warning}
                iconName="map-pin"
                onComplete={() => {
                  updateStatus.mutate({ taskId: displayRide.id, status: "ARRIVED_PICKUP" });
                }}
              />
            )}

            {taskStatus === "arrived" && (
              <SwipeButton
                text={updateStatus.isPending ? "Updating..." : "Confirm pickup"}
                buttonColor={tokens.success}
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
                text={updateStatus.isPending ? "Updating..." : "Slide to deliver"}
                buttonColor={tokens.primary}
                iconName="check-circle"
                onComplete={() => {
                  updateStatus.mutate(
                    { taskId: displayRide.id, status: "DELIVERED" },
                    {
                      onSuccess: () =>
                        Toast.show({
                          type: "success",
                          text1: "Delivery Complete!",
                          text2: `${formatMoney(Number(displayRide.driverPayout))} added to your pending earnings.`,
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

  const status = activeRide
    ? { label: "On a job", dot: "bg-primary" }
    : statusLoading
      ? { label: "Checking…", dot: "bg-muted-foreground" }
      : isOnline
        ? { label: "Online", dot: "bg-success" }
        : { label: "Offline", dot: "bg-muted-foreground" };
  const todayEarnings = displayMoney(Number(earnings?.todayRevenue ?? 0), balancesHidden);

  return (
    <View className="flex-1 bg-background">
      <MapView
        ref={mapRef}
        style={{ width: "100%", height: "100%", position: "absolute" }}
        provider={mapProvider}
        customMapStyle={darkMapStyle}
        userInterfaceStyle="dark"
        initialRegion={defaultRegion}
        showsUserLocation={false} // We are rendering our own custom marker below
        showsMyLocationButton={false}
      >
        {renderRoute()}

        {/* Dispatcher (User) Marker - Always visible when online/location known */}
        {userLocation && (
          <Marker coordinate={userLocation} title="You" zIndex={999}>
            <View className="w-10 h-10 bg-primary-subtle rounded-full items-center justify-center border border-border">
              <View className="w-6 h-6 bg-primary rounded-full border-2 border-white items-center justify-center">
                <Icon name="truck" size={12} color={tokens.primaryText} />
              </View>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Floating status + today's earnings */}
      <View
        pointerEvents="box-none"
        className="absolute left-0 right-0 z-10 px-5 flex-row items-center justify-between"
        style={{ top: Math.max(insets.top, 12) + 12 }}
      >
        <View
          accessible
          accessibilityLabel={`Status: ${status.label}`}
          className="h-11 px-4 rounded-full bg-card border border-border flex-row items-center gap-2"
        >
          <View className={`w-2.5 h-2.5 rounded-full ${status.dot}`} />
          <Text className="text-foreground font-heading font-bold text-body-md">
            {status.label}
          </Text>
        </View>

        {earningsLoaded && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Today's earnings: ${balancesHidden ? "hidden" : todayEarnings}`}
            accessibilityHint="Opens your earnings"
            onPress={() => router.push("/(dispatcher)/(tabs)/(earnings)")}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="h-11 px-4 rounded-full bg-card border border-border flex-row items-center gap-2"
          >
            <Icon name="wallet" size={16} color={tokens.primary} />
            <Text className="text-foreground font-heading font-bold text-body-md">
              {todayEarnings}
            </Text>
            <Text className="text-foreground-secondary font-body text-body-sm">today</Text>
          </Pressable>
        )}
      </View>

      {/* Re-center map — rides just above whichever sheet is showing */}
      {sheetHeight > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Center map on your location"
          accessibilityState={{ disabled: !userLocation }}
          disabled={!userLocation}
          onPress={() => {
            if (!userLocation) return;
            mapRef.current?.animateToRegion(
              { ...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 },
              500
            );
          }}
          style={({ pressed }) => [{ bottom: sheetHeight + 16, opacity: pressed ? 0.7 : 1 }]}
          className={`absolute right-5 w-12 h-12 rounded-full bg-card border border-border items-center justify-center ${userLocation ? "" : "opacity-50"}`}
        >
          <Icon name="crosshair" size={22} color={tokens.primary} />
        </Pressable>
      )}

      <View
        testID="dispatcher-sheet"
        onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}
        className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl border-t border-border"
        style={{ paddingBottom: bottomInset }}
      >
        {renderBottomSheet()}
      </View>
    </View>
  );
}

// Soft ping around the icon so "online and waiting" reads as alive, not stuck.
function SearchingPulse() {
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View className="w-12 h-12">
      <Animated.View
        className="absolute inset-0 rounded-2xl border-2 border-success"
        style={{
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }) }],
        }}
      />
      <View className="w-12 h-12 rounded-2xl bg-success-light items-center justify-center">
        <Icon name="radio" size={22} color={tokens.success} />
      </View>
    </View>
  );
}

function LocationNotice({ onEnable }: { onEnable: () => void }) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-warning-light p-3">
      <Icon name="map-pin" size={20} color={tokens.warning} />
      <View className="flex-1">
        <Text className="text-foreground font-heading font-bold text-body-md">Location is off</Text>
        <Text className="text-foreground-secondary font-body text-body-sm">
          {"Customers can't find you without it."}
        </Text>
      </View>
      <Button
        title="Turn on"
        variant="outline"
        size="sm"
        onPress={onEnable}
        accessibilityLabel="Turn on location"
      />
    </View>
  );
}
