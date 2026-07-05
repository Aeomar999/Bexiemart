import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useState, useMemo } from "react";
import { useServices, useServiceBookings } from "@/lib/hooks/use-services";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PromoBanner } from "@/components/ui/PromoBanner";
import { StatusBanner } from "@/components/ui/StatusBanner";

const CATEGORIES = [
  { id: "1", name: "Cleaning", icon: "wind", color: "#0ea5e9" },
  { id: "2", name: "Plumbing", icon: "tool", color: "#f59e0b" },
  { id: "3", name: "Electrical", icon: "zap", color: "#eab308" },
  { id: "4", name: "AC Repair", icon: "thermometer", color: "#3b82f6" },
  { id: "5", name: "Painting", icon: "edit-2", color: "#8b5cf6" },
  { id: "6", name: "Beauty", icon: "scissors", color: "#ec4899" },
];

export default function ServicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const {
    data: servicesData,
    isPending,
    isError,
    refetch,
  } = useServices(
    activeCategory
      ? { category: activeCategory }
      : searchQuery
        ? { search: searchQuery }
        : undefined
  );
  const { data: bookingsData } = useServiceBookings();
  const providers = servicesData?.services ?? [];
  const categories = servicesData?.categories ?? [];
  const activeBookings = bookingsData ?? [];

  const CATEGORIES = useMemo(
    () =>
      categories.map((cat: string, i: number) => ({
        id: String(i + 1),
        name: cat,
        icon: ["wind", "tool", "zap", "thermometer", "edit-2", "scissors"][i % 6],
        color: ["#0ea5e9", "#f59e0b", "#eab308", "#3b82f6", "#8b5cf6", "#ec4899"][i % 6],
      })),
    [categories]
  );

  // Filter providers locally
  const filteredProviders = providers.filter((provider: any) => {
    const matchesSearch =
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (provider.category ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory ? provider.category === activeCategory : true;
    return matchesSearch && matchesCategory;
  });

  if (isPending) {
    return <LoadingState type="grid" message="Loading services..." />;
  }

  if (isError) {
    return <ErrorState message="Failed to load home services." onRetry={refetch} />;
  }

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pb-4 bg-card border-b border-border"
        style={{ paddingTop: Math.max(insets.top, 20) + 12 }}
      >
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center gap-3">
            <BackButton />
            <Text className="text-display-sm font-heading font-black text-foreground">
              Home Services
            </Text>
          </View>
        </View>

        <View className="flex-row items-center bg-background rounded-2xl px-4 py-3 border border-border">
          <Icon name="search" size={18} color="#64748b" />
          <TextInput
            placeholder="What service do you need?"
            className="flex-1 ml-2 font-body text-body-lg text-foreground"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setSearchQuery("")}
            >
              <Icon name="x-circle" size={18} color="#cbd5e1" />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Active Booking Banner */}
        {activeBookings.length > 0 && (
          <StatusBanner
            className="px-5 mt-6"
            icon="calendar"
            title="Upcoming Appointment"
            subtitle={`${activeBookings[0].providerName} • ${activeBookings[0].time}`}
            actionLabel="View"
          />
        )}

        {/* Promotional Banner */}
        {!activeCategory && searchQuery === "" && (
          <PromoBanner placement="SERVICES" containerClassName="mb-8 mt-6" />
        )}

        {/* Categories */}
        {searchQuery === "" && (
          <View className={`px-5 ${activeCategory ? "mt-6 mb-6" : "mb-10"}`}>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-heading-md font-heading font-bold text-foreground">
                Categories
              </Text>
              {activeCategory && (
                <Pressable onPress={() => setActiveCategory(null)}>
                  <Text className="text-primary font-bold text-sm">Clear Filter</Text>
                </Pressable>
              )}
            </View>

            <View className="flex-row flex-wrap justify-between gap-y-4">
              {CATEGORIES.map((item: any) => {
                const isActive = activeCategory === item.name;
                return (
                  <Pressable
                    key={item.id}
                    className="w-[30%] items-center"
                    onPress={() => setActiveCategory(isActive ? null : item.name)}
                  >
                    <View
                      className={`w-16 h-16 rounded-2xl items-center justify-center mb-2 ${isActive ? "border border-primary" : ""}`}
                      style={{ backgroundColor: isActive ? "#eff6ff" : item.color + "15" }}
                    >
                      <Icon name={item.icon} size={28} color={isActive ? "#3b82f6" : item.color} />
                    </View>
                    <Text
                      className={`text-body-sm ${isActive ? "font-black text-primary-hover" : "font-bold text-foreground"}`}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Providers List */}
        <View className="px-5 pb-10">
          <Text className="text-heading-md font-heading font-bold text-foreground mb-4">
            {searchQuery
              ? "Search Results"
              : activeCategory
                ? `${activeCategory} Providers`
                : "Top Rated Providers"}
          </Text>

          {filteredProviders.length === 0 ? (
            <View className="py-4">
              <EmptyState
                title="No providers found"
                description="Try adjusting your search or filters."
                iconName="search"
                fullScreen={false}
              />
            </View>
          ) : (
            <View className="gap-4">
              {filteredProviders.map((provider: any) => (
                <Pressable
                  key={provider.id}
                  className="bg-card rounded-2xl p-4 flex-row items-center border border-border"
                  onPress={() => router.push(`/(customer)/services/${provider.id}`)}
                >
                  <View className="w-20 h-20 bg-muted rounded-xl items-center justify-center mr-4 overflow-hidden">
                    <Icon name="user" size={32} color="#94a3b8" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-body-lg font-bold text-foreground font-heading mb-0.5">
                      {provider.vendor?.shopName ?? provider.name}
                    </Text>
                    <Text className="text-body-sm text-muted-foreground font-body mb-2">
                      {provider.name}
                    </Text>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Icon name="star" size={12} color="#f59e0b" />
                        <Text className="text-body-sm font-bold text-muted-foreground ml-1">
                          {Number(provider.rating).toFixed(1)}
                        </Text>
                        <Text className="text-body-sm text-muted-foreground ml-1">
                          ({provider.ratingCount})
                        </Text>
                      </View>
                      <Text className="text-sm font-bold text-primary">
                        {provider.priceDisplay ?? `GHS ${Number(provider.price).toFixed(2)}`}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
