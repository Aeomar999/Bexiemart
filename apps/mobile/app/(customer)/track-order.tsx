import { LoadingState } from "@/components/ui/LoadingState";
import { tokens } from "@/theme/tokens";
import { View, Text, Pressable, Linking, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "@/components/ui/BackButton";
import { Icon } from "@/components/ui/Icon";
import { usePopupStore } from "@/lib/stores/popup-store";
import { useEffect, useState, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { darkMapStyle } from "@/lib/constants/map-style";
import { deliveryApi, DeliveryJob } from "@/lib/api/delivery";
import { deliverySocketService } from "@/lib/delivery-socket";
import { decodePolyline } from "@/lib/maps";

type Coords = { latitude: number; longitude: number };

// Map server lifecycle status → customer-facing summary.
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Searching...",
  ASSIGNED: "Rider assigned",
  EN_ROUTE_PICKUP: "Heading to pickup",
  ARRIVED_PICKUP: "At pickup",
  PICKED_UP: "Picked up",
  EN_ROUTE_DROPOFF: "On the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const isActive = (status: string) => !["DELIVERED", "CANCELLED", "EXPIRED"].includes(status);

export default function TrackOrderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const showPopup = usePopupStore((s) => s.showPopup);
  const mapRef = useRef<MapView>(null);

  const [driverCoords, setDriverCoords] = useState<Coords | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [actioning, setActioning] = useState(false);

  const {
    data: job,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["delivery", "job", id],
    queryFn: async () => {
      const { data } = await deliveryApi.getJob(id);
      return data as DeliveryJob;
    },
    enabled: !!id,
    refetchInterval: (q) =>
      q.state.data && isActive((q.state.data as DeliveryJob).status) ? 8000 : false,
  });

  const status = liveStatus ?? job?.status ?? "PENDING";

  // Live socket subscription for driver position + status changes.
  useEffect(() => {
    if (!id) return;
    deliverySocketService.connect();
    deliverySocketService.subscribeJob(id);
    const socket = deliverySocketService.get();

    const onLocation = (data: { jobId: string; lat: number; lng: number }) => {
      if (data.jobId === id) setDriverCoords({ latitude: data.lat, longitude: data.lng });
    };
    const onUpdate = (data: { id: string; status: string }) => {
      if (data.id === id) {
        setLiveStatus(data.status);
        refetch();
      }
    };
    socket?.on("driver_location", onLocation);
    socket?.on("job_update", onUpdate);

    return () => {
      socket?.off("driver_location", onLocation);
      socket?.off("job_update", onUpdate);
      deliverySocketService.unsubscribeJob(id);
    };
  }, [id, refetch]);

  const pickup = useMemo<Coords | null>(
    () => (job ? { latitude: job.pickupLat, longitude: job.pickupLng } : null),
    [job]
  );
  const dropoff = useMemo<Coords | null>(
    () => (job ? { latitude: job.dropoffLat, longitude: job.dropoffLng } : null),
    [job]
  );
  const routeCoords = useMemo(() => decodePolyline(job?.routePolyline), [job?.routePolyline]);

  // Driver marker: prefer live socket, fall back to last known dispatcher fix.
  const driver =
    driverCoords ??
    (job?.dispatcher?.lastLatitude != null && job?.dispatcher?.lastLongitude != null
      ? { latitude: job.dispatcher.lastLatitude, longitude: job.dispatcher.lastLongitude }
      : null);

  // Keep both endpoints framed.
  useEffect(() => {
    const pts = [pickup, dropoff, driver].filter(Boolean) as Coords[];
    if (pts.length >= 2) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(pts, {
          edgePadding: { top: 120, right: 60, bottom: 400, left: 60 },
          animated: true,
        });
      }, 500);
    }
  }, [pickup?.latitude, dropoff?.latitude, driver?.latitude]);

  const handleCancel = async () => {
    if (!id) return;
    setActioning(true);
    try {
      await deliveryApi.cancel(id);
      showPopup({ type: "error", title: "Ride Cancelled", message: "Your request was cancelled." });
      router.replace("/(customer)/(tabs)/(home)");
    } catch {
      showPopup({
        type: "error",
        title: "Could not cancel",
        message: "The ride may be in progress.",
      });
    } finally {
      setActioning(false);
    }
  };

  const handleConfirm = async () => {
    if (!id) return;
    setActioning(true);
    try {
      await deliveryApi.confirm(id);
      showPopup({
        type: "success",
        title: "Delivery confirmed",
        message: "Thanks! Your rider has been paid.",
      });
      router.replace("/(customer)/(tabs)/(home)");
    } catch {
      showPopup({ type: "error", title: "Could not confirm", message: "Please try again." });
    } finally {
      setActioning(false);
    }
  };

  if (isLoading || !job) {
    return <LoadingState type="detail" />;
  }

  const canCancel = ["PENDING", "ASSIGNED", "EN_ROUTE_PICKUP", "ARRIVED_PICKUP"].includes(status);
  const delivered = status === "DELIVERED";

  return (
    <View className="flex-1 bg-background">
      <MapView
        ref={mapRef}
        style={{ width: "100%", height: "100%", position: "absolute" }}
        provider={PROVIDER_GOOGLE}
        customMapStyle={darkMapStyle}
        initialRegion={{
          latitude: job.pickupLat,
          longitude: job.pickupLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {routeCoords.length > 1 ? (
          <Polyline coordinates={routeCoords} strokeColor={tokens.primary} strokeWidth={4} />
        ) : (
          pickup &&
          dropoff && (
            <Polyline
              coordinates={[pickup, dropoff]}
              strokeColor={tokens.primary}
              strokeWidth={4}
              lineDashPattern={[10, 10]}
            />
          )
        )}

        {pickup && (
          <Marker coordinate={pickup} anchor={{ x: 0.5, y: 0.5 }}>
            <View className="w-6 h-6 bg-error rounded-full items-center justify-center border-2 border-white">
              <View className="w-2 h-2 bg-white rounded-full" />
            </View>
          </Marker>
        )}
        {dropoff && (
          <Marker coordinate={dropoff} anchor={{ x: 0.5, y: 0.5 }}>
            <View className="w-6 h-6 bg-emerald-500 rounded-full items-center justify-center border-2 border-white">
              <View className="w-2 h-2 bg-white rounded-full" />
            </View>
          </Marker>
        )}
        {driver && (
          <Marker coordinate={driver} anchor={{ x: 0.5, y: 0.5 }}>
            <View className="w-10 h-10 bg-primary rounded-full items-center justify-center border-4 border-white">
              <Icon name="truck" size={16} color="#fff" />
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
            <Text className="text-display-sm font-heading font-black text-foreground">
              Track Order
            </Text>
          </View>
          {canCancel && (
            <Pressable
              className="h-10 px-4 rounded-full bg-rose-50 flex-row items-center justify-center border border-rose-200 gap-1.5"
              onPress={handleCancel}
              disabled={actioning}
            >
              <Icon name="x" size={14} color="#ef4444" />
              <Text className="text-sm font-bold text-error font-heading">Cancel</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Bottom Sheet */}
      <View className="absolute bottom-0 left-0 right-0">
        <View
          className="bg-card rounded-t-3xl p-6 border-t border-border"
          style={{ paddingBottom: Math.max(insets.bottom, 24) }}
        >
          <View className="w-12 h-1.5 bg-secondary rounded-full mx-auto mb-6" />

          <View className="flex-row justify-between items-end mb-6">
            <View>
              <Text className="text-display-md font-heading font-black text-foreground">
                {STATUS_LABEL[status] ?? status}
              </Text>
              <Text className="text-body-lg font-body text-muted-foreground mt-1">
                {status === "PENDING"
                  ? "Finding the nearest rider"
                  : delivered
                    ? "Confirm to release payment"
                    : `${job.vehicleType} • GHS ${Number(job.customerFee).toFixed(2)}`}
              </Text>
            </View>
            <View className="px-3 py-1.5 rounded-md flex-row items-center gap-1.5 bg-primary-subtle border border-border">
              <View
                className={`w-2 h-2 rounded-full ${isActive(status) ? "bg-emerald-500" : "bg-slate-400"}`}
              />
              <Text className="text-body-sm font-bold uppercase tracking-wider text-primary">
                {job.jobNumber}
              </Text>
            </View>
          </View>

          {/* Rider Info */}
          {job.dispatcher ? (
            <View className="flex-row items-center justify-between bg-background p-4 rounded-2xl border border-border mb-6">
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center border border-border">
                  <Icon name="user" size={24} color="#64748b" />
                </View>
                <View>
                  <Text className="text-body-lg font-bold text-foreground font-heading">
                    {job.dispatcher.user.name}
                  </Text>
                  <Text className="text-sm text-muted-foreground font-body">
                    {job.dispatcher.vehicleType} • {job.dispatcher.plateNumber}
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Call rider"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center border border-emerald-100"
                onPress={() => Linking.openURL("tel:0541234567").catch(() => {})}
              >
                <Icon name="phone" size={18} color="#059669" />
              </Pressable>
            </View>
          ) : (
            <View className="flex-row items-center justify-center bg-background p-6 rounded-2xl border border-border mb-6 border-dashed">
              <Text className="text-body-md text-muted-foreground font-body">
                Matching you with a rider nearby...
              </Text>
            </View>
          )}

          {delivered && (
            <Pressable
              className="bg-primary w-full h-14 rounded-full items-center justify-center"
              onPress={handleConfirm}
              disabled={actioning}
            >
              {actioning ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-body-lg">Confirm Delivery</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
