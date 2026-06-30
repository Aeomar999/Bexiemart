import { LoadingState } from "@/components/ui/LoadingState";
import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, TextInput, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useMemo } from "react";
import { Image } from "expo-image";
import { Icon } from "@/components/ui/Icon";
import { PromoBanner } from "@/components/ui/PromoBanner";
import { useFoodRestaurants, useFoodCart } from "@/lib/hooks/use-food";

const CATEGORIES = [
  { id: "1", name: "Fast Food", icon: "fast-forward" },
  { id: "2", name: "Local", icon: "map-pin" },
  { id: "3", name: "Healthy", icon: "heart" },
  { id: "4", name: "Desserts", icon: "coffee" },
];

export default function FoodDeliveryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: restaurantsData, isLoading } = useFoodRestaurants(
    selectedCategory ? { category: selectedCategory } : undefined
  );
  const { data: cartData } = useFoodCart();
  const cartItems = cartData?.items ?? [];
  const cartItemCount = cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0);
  const restaurants = restaurantsData ?? [];

  const CATEGORIES = [
    { id: "1", name: "Fast Food", icon: "fast-forward" },
    { id: "2", name: "Local", icon: "map-pin" },
    { id: "3", name: "Healthy", icon: "heart" },
    { id: "4", name: "Desserts", icon: "coffee" },
  ];

  const filteredRestaurants = useMemo(() => {
    if (!searchQuery) return restaurants;
    const q = searchQuery.toLowerCase();
    return restaurants.filter((r: any) => (r.shopName ?? "").toLowerCase().includes(q));
  }, [searchQuery, restaurants]);

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center gap-3">
            <BackButton />
            <Text className="text-display-sm font-heading font-black text-foreground">
              Food Delivery
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="w-10 h-10 rounded-full bg-background items-center justify-center relative"
            onPress={() => router.push("/(customer)/food-cart")}
          >
            <Icon name="shopping-bag" size={20} color="#0f172a" />
            {cartItemCount > 0 && (
              <View className="absolute top-0 right-0 w-4 h-4 bg-error rounded-full items-center justify-center">
                <Text className="text-white font-bold text-caption">{cartItemCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View className="flex-row items-center bg-background rounded-2xl px-4 py-3 border border-border">
          <Icon name="search" size={18} color="#64748b" />
          <TextInput
            placeholder="Search restaurants, dishes..."
            className="flex-1 ml-2 font-body text-body-lg text-foreground"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Icon name="x" size={16} color="#94a3b8" />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <LoadingState type="grid" />
        ) : (
          <>
            {/* Categories */}
            <View className="py-6">
              <FlatList
                data={CATEGORIES}
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={80} // 64px (w-16) + 16px gap
                snapToAlignment="start"
                contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isSelected = selectedCategory === item.id;
                  return (
                    <Pressable
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      className="items-center"
                      onPress={() => setSelectedCategory(isSelected ? null : item.id)}
                    >
                      <View
                        className={`w-16 h-16 rounded-2xl items-center justify-center mb-2 border ${isSelected ? "bg-orange-500 border-orange-600" : "bg-orange-50 border-orange-100"}`}
                      >
                        <Icon
                          name={item.icon}
                          size={24}
                          color={isSelected ? "#ffffff" : "#ea580c"}
                        />
                      </View>
                      <Text
                        className={`text-sm font-bold font-body ${isSelected ? "text-orange-600" : "text-muted-foreground"}`}
                      >
                        {item.name}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            </View>

            {/* Featured Banner */}
            {!searchQuery && !selectedCategory && (
              <PromoBanner placement="FOOD" containerClassName="mb-8" />
            )}

            {/* Restaurants List */}
            <View className="px-5 pb-10">
              <Text className="text-heading-md font-heading font-bold text-foreground mb-4">
                {searchQuery || selectedCategory ? "Results" : "Popular Restaurants"}
              </Text>

              {filteredRestaurants.length === 0 ? (
                <View className="items-center justify-center py-10">
                  <Icon name="search" size={48} color="#cbd5e1" />
                  <Text className="text-body-lg font-bold text-muted-foreground mt-4">
                    No restaurants found
                  </Text>
                  <Text className="text-body-md text-muted-foreground mt-1">
                    Try adjusting your search or filters.
                  </Text>
                </View>
              ) : (
                <View className="gap-5">
                  {filteredRestaurants.map((restaurant: any) => (
                    <Pressable
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      key={restaurant.id}
                      className="bg-card rounded-2xl overflow-hidden border border-border"
                      onPress={() => router.push(`/(customer)/restaurant/${restaurant.id}`)}
                    >
                      <View className="h-32 bg-secondary items-center justify-center">
                        {restaurant.banner ? (
                          <Image
                            source={{ uri: restaurant.banner }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                          />
                        ) : (
                          <Icon name="image" size={32} color="#94a3b8" />
                        )}
                      </View>
                      <View className="p-4">
                        <View className="flex-row justify-between items-start mb-2">
                          <Text className="text-body-lg font-bold text-foreground font-heading">
                            {restaurant.shopName}
                          </Text>
                        </View>
                        <Text className="text-sm text-muted-foreground font-body mb-3">
                          {restaurant.description ?? `${restaurant._count?.foodItems ?? 0} items`}
                        </Text>
                        <View className="flex-row gap-4">
                          <View className="flex-row items-center gap-1.5">
                            <Icon name="map-pin" size={14} color="#64748b" />
                            <Text className="text-sm font-bold text-muted-foreground">
                              {restaurant.city ?? restaurant.address ?? "Accra"}
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-1.5">
                            <Icon name="shopping-bag" size={14} color="#64748b" />
                            <Text className="text-sm font-bold text-muted-foreground">
                              {restaurant._count?.foodItems ?? 0} items
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
