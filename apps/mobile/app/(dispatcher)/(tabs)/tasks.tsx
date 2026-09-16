import { tokens } from "@/theme/tokens";
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
        <View className="items-center justify-center py-20 px-5">
          <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
            <Icon name="package" size={32} color={tokens.textMuted} />
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
      <View className="pb-20">
        {rides.map((ride: any) => (
          <View
            key={ride.id}
            className="w-full h-[70px] px-5 bg-card border-b border-border flex-row items-center justify-between"
          >
            <View className="flex-1 justify-center pr-2">
              <Text className="text-[14px] font-bold text-foreground mb-0.5" numberOfLines={1}>
                {ride.customer?.name || "Ride Request"}
              </Text>
              <Text className="text-[11px] text-muted-foreground font-body" numberOfLines={1}>
                {ride.pickupAddress || "Pickup"} • {ride.dropoffAddress || "Dropoff"}
              </Text>
            </View>
            <View className="items-end justify-center">
              <Text
                className="text-[15px] font-black text-primary font-heading tracking-tight mb-1"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                GH₵ {Number(ride.driverPayout).toFixed(2)}
              </Text>
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
                className="px-3 py-1 bg-primary rounded-full"
              >
                <Text className="text-[10px] font-bold text-white uppercase">Accept</Text>
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
        <View className="items-center justify-center py-20 px-5">
          <View className="w-20 h-20 bg-primary-subtle rounded-full items-center justify-center mb-4">
            <Icon name="truck" size={32} color={tokens.primary} />
          </View>
          <Text className="text-heading-md font-bold font-heading text-foreground mb-2">
            No Active Tasks
          </Text>
          <Text className="text-muted-foreground font-body text-center">
            You don&apos;t have any ongoing deliveries right now.
          </Text>
        </View>
      );
    }

    return (
      <View className="pb-20">
        {rides.map((ride: any) => (
          <View
            key={ride.id}
            className="w-full h-[70px] px-5 bg-card border-b border-border flex-row items-center justify-between border-l-4 border-l-primary"
          >
            <View className="flex-1 justify-center pr-2">
              <Text className="text-[14px] font-bold text-foreground mb-0.5" numberOfLines={1}>
                Active Ride
              </Text>
              <Text className="text-[11px] text-muted-foreground font-body" numberOfLines={1}>
                {ride.pickupAddress || "Pickup"} • {ride.dropoffAddress || "Dropoff"}
              </Text>
            </View>
            <View className="items-end justify-center">
              <Text
                className="text-[15px] font-black text-foreground font-heading tracking-tight mb-1"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                GH₵ {Number(ride.driverPayout).toFixed(2)}
              </Text>
              <Pressable
                className="px-3 py-1 bg-slate-100 rounded-full"
                onPress={() => router.replace("/(dispatcher)/(tabs)/(home)")}
              >
                <Text className="text-[10px] font-bold text-foreground uppercase">Map</Text>
              </Pressable>
            </View>
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
        <View className="items-center justify-center py-20 px-5">
          <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
            <Icon name="check-circle" size={32} color={tokens.textMuted} />
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
      <View className="pb-20">
        <View className="px-5 py-3 bg-muted">
          <Text className="font-bold font-heading text-[11px] text-muted-foreground uppercase tracking-wider">
            History
          </Text>
        </View>
        {rides.map((ride: any) => (
          <View
            key={ride.id}
            className="w-full h-[70px] px-5 bg-card border-b border-border flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3 flex-1 pr-2">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${ride.status === "DELIVERED" ? "bg-emerald-100" : "bg-rose-100"}`}
              >
                <Icon
                  name={ride.status === "DELIVERED" ? "check" : "x"}
                  size={14}
                  color={ride.status === "DELIVERED" ? tokens.success : tokens.error}
                />
              </View>
              <View className="flex-1 justify-center">
                <Text className="text-[14px] font-bold text-foreground mb-0.5" numberOfLines={1}>
                  Ride {ride.status === "DELIVERED" ? "Completed" : "Cancelled"}
                </Text>
                <Text className="text-[11px] text-muted-foreground font-body" numberOfLines={1}>
                  {new Date(ride.updatedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  • {ride.dropoffAddress || "Unknown"}
                </Text>
              </View>
            </View>
            <View className="items-end justify-center">
              <Text
                className={`text-[15px] font-black font-heading tracking-tight ${ride.status === "DELIVERED" ? "text-emerald-600" : "text-muted-foreground"}`}
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {ride.status === "DELIVERED" ? "+" : ""}GH₵ {Number(ride.price).toFixed(2)}
              </Text>
            </View>
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
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={isManualRefreshing}
            onRefresh={handleRefresh}
            tintColor={tokens.primary}
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
