import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { SwipeButton } from "@/components/ui/SwipeButton";
import { useAvailableTasks, useMyTasks, useAcceptTask } from "@/lib/hooks/use-dispatcher";
import Toast from "@/lib/toast-polyfill";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

type TabType = "available" | "active" | "completed";

export default function DispatcherTasks() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>("available");

  // We consider the dispatcher "online" if they are viewing the available tasks.
  // In a real app, online status should be global.
  const {
    data: availableData,
    isLoading: loadingAvailable,
    refetch: refetchAvailable,
    isRefetching: isRefetchingAvailable,
  } = useAvailableTasks(activeTab === "available");

  const {
    data: activeData,
    isLoading: loadingActive,
    refetch: refetchActive,
    isRefetching: isRefetchingActive,
  } = useMyTasks("active");

  const {
    data: completedData,
    isLoading: loadingCompleted,
    refetch: refetchCompleted,
    isRefetching: isRefetchingCompleted,
  } = useMyTasks("completed");

  const acceptTask = useAcceptTask();

  const tabs: { id: TabType; label: string }[] = [
    { id: "available", label: "Available" },
    { id: "active", label: "Active" },
    { id: "completed", label: "Completed" },
  ];

  const renderAvailable = () => {
    const rides = availableData?.jobs || [];

    if (loadingAvailable) {
      return <ListSkeleton />;
    }

    if (rides.length === 0) {
      return (
        <View className="items-center justify-center py-20">
          <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
            <Icon name="package" size={32} color="#94a3b8" />
          </View>
          <Text className="text-heading-md font-bold font-heading text-foreground mb-2">
            No Available Tasks
          </Text>
          <Text className="text-muted-foreground font-body text-center">
            There are no pending requests right now.
          </Text>
        </View>
      );
    }

    return (
      <View className="gap-4 pb-20">
        {rides.map((ride: any) => (
          <View key={ride.id} className="bg-card rounded-2xl p-4 border border-border">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <View className="bg-primary-subtle p-2 rounded-full">
                  <Icon name="package" size={16} color="var(--color-primary)" />
                </View>
                <Text className="font-bold text-foreground font-body">Ride Request</Text>
              </View>
              <Text className="font-black text-primary text-heading-md font-heading">
                GH₵ {Number(ride.driverPayout).toFixed(2)}
              </Text>
            </View>

            <View className="gap-2 mb-4">
              <View className="flex-row items-center gap-3">
                <View className="w-2 h-2 rounded-full bg-error" />
                <Text
                  className="text-muted-foreground text-body-md font-body flex-1"
                  numberOfLines={1}
                >
                  {ride.pickupAddress || "Pickup Location"}
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <View className="w-2 h-2 rounded-full bg-emerald-500" />
                <Text
                  className="text-muted-foreground text-body-md font-body flex-1"
                  numberOfLines={1}
                >
                  {ride.dropoffAddress || "Dropoff Location"}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between mt-2 pt-4 border-t border-border">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden">
                  {ride.customer?.image ? (
                    <Image
                      source={{ uri: ride.customer.image }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <Icon name="user" size={16} color="#94a3b8" />
                  )}
                </View>
                <Text className="font-bold font-body text-foreground">{ride.customer?.name}</Text>
              </View>
              <Pressable
                disabled={acceptTask.isPending}
                onPress={() => {
                  acceptTask.mutate(
                    { taskId: ride.id },
                    {
                      onSuccess: () => {
                        Toast.show({
                          type: "success",
                          text1: "Task Accepted!",
                          text2: "Go to the map to start navigation.",
                        });
                        setActiveTab("active");
                      },
                      onError: (error: any) => {
                        Toast.show({
                          type: "error",
                          text1: "Failed to accept task",
                          text2: error.response?.data?.message || error.message,
                        });
                      },
                    }
                  );
                }}
                className="bg-primary px-4 py-2 rounded-full"
              >
                <Text className="text-white font-bold font-body">Accept</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderActive = () => {
    const rides = activeData?.jobs || [];

    if (loadingActive) {
      return <ListSkeleton />;
    }

    if (rides.length === 0) {
      return (
        <View className="items-center justify-center py-20">
          <View className="w-20 h-20 bg-primary-subtle rounded-full items-center justify-center mb-4">
            <Icon name="truck" size={32} color="var(--color-primary)" />
          </View>
          <Text className="text-heading-md font-bold font-heading text-foreground mb-2">
            No Active Tasks
          </Text>
          <Text className="text-muted-foreground font-body text-center">
            You don't have any ongoing deliveries right now.
          </Text>
        </View>
      );
    }

    return (
      <View className="gap-4 pb-20">
        {rides.map((ride: any) => (
          <View
            key={ride.id}
            className="bg-card rounded-2xl p-4 border border-border border-l-4 border-l-primary shadow-sm"
          >
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="font-bold text-foreground font-body">Active Ride</Text>
                <Text className="text-primary font-bold text-body-sm uppercase tracking-wider">
                  {ride.status}
                </Text>
              </View>
              <Text className="font-black text-foreground text-heading-md font-heading">
                GH₵ {Number(ride.driverPayout).toFixed(2)}
              </Text>
            </View>

            <View className="gap-2 mb-4">
              <View className="flex-row items-center gap-3">
                <View className="w-2 h-2 rounded-full bg-error" />
                <Text
                  className="text-muted-foreground text-body-md font-body flex-1"
                  numberOfLines={1}
                >
                  {ride.pickupAddress || "Pickup Location"}
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <View className="w-2 h-2 rounded-full bg-emerald-500" />
                <Text
                  className="text-muted-foreground text-body-md font-body flex-1"
                  numberOfLines={1}
                >
                  {ride.dropoffAddress || "Dropoff Location"}
                </Text>
              </View>
            </View>

            <Pressable
              className="bg-slate-100 p-3 rounded-xl flex-row items-center justify-center gap-2 mt-2"
              onPress={() => {
                // Navigate to Map View to see active route
                router.replace("/(dispatcher)/(tabs)/(home)");
              }}
            >
              <Icon name="map" size={16} color="#0f172a" />
              <Text className="font-bold text-foreground font-body">View on Map</Text>
            </Pressable>
          </View>
        ))}
      </View>
    );
  };

  const renderCompleted = () => {
    const rides = completedData?.jobs || [];

    if (loadingCompleted) {
      return <ListSkeleton />;
    }

    if (rides.length === 0) {
      return (
        <View className="items-center justify-center py-20">
          <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
            <Icon name="check-circle" size={32} color="#94a3b8" />
          </View>
          <Text className="text-heading-md font-bold font-heading text-foreground mb-2">
            No History Yet
          </Text>
          <Text className="text-muted-foreground font-body text-center">
            Completed tasks will appear here.
          </Text>
        </View>
      );
    }

    return (
      <View className="gap-4 pb-20">
        <Text className="font-bold font-heading text-muted-foreground mb-2">HISTORY</Text>
        {rides.map((ride: any) => (
          <View
            key={ride.id}
            className="bg-card border border-border p-4 rounded-2xl flex-row items-center justify-between opacity-80"
          >
            <View className="flex-row items-center gap-3 flex-1 mr-4">
              <View
                className={`w-12 h-12 rounded-full items-center justify-center ${ride.status === "DELIVERED" ? "bg-emerald-100" : "bg-rose-100"}`}
              >
                <Icon
                  name={ride.status === "DELIVERED" ? "check" : "x"}
                  size={20}
                  color={ride.status === "DELIVERED" ? "#10b981" : "#e11d48"}
                />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-foreground font-heading">
                  Ride {ride.status === "DELIVERED" ? "Completed" : "Cancelled"}
                </Text>
                <Text className="text-muted-foreground text-sm font-body" numberOfLines={1}>
                  {new Date(ride.updatedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  • {ride.dropoffAddress || "Unknown"}
                </Text>
              </View>
            </View>
            <Text
              className={`font-black text-body-lg font-heading ${ride.status === "DELIVERED" ? "text-emerald-600" : "text-muted-foreground"}`}
            >
              {ride.status === "DELIVERED" ? "+" : ""}GH₵ {Number(ride.price).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    if (activeTab === "available") await refetchAvailable();
    if (activeTab === "active") await refetchActive();
    if (activeTab === "completed") await refetchCompleted();
    setIsManualRefreshing(false);
  }, [activeTab, refetchAvailable, refetchActive, refetchCompleted]);

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border"
        style={{ paddingTop: Math.max(insets.top, 12) + 12 }}
      >
        <Text className="text-display-sm font-heading font-black text-foreground mb-4">Tasks</Text>

        {/* Custom Tab Bar */}
        <View className="flex-row bg-slate-100 p-1 rounded-xl">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: isActive ? "white" : "transparent",
                  shadowColor: isActive ? "#000" : "transparent",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isActive ? 0.05 : 0,
                  shadowRadius: 2,
                  elevation: isActive ? 1 : 0,
                }}
              >
                <Text
                  className={`font-bold font-body ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        className="flex-1 p-5"
        refreshControl={
          <RefreshControl
            refreshing={isManualRefreshing}
            onRefresh={handleRefresh}
            tintColor="var(--color-primary)"
          />
        }
      >
        {activeTab === "available" && renderAvailable()}
        {activeTab === "active" && renderActive()}
        {activeTab === "completed" && renderCompleted()}
      </ScrollView>
    </View>
  );
}
