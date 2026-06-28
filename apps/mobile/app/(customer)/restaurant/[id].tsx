import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, Dimensions, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useFoodRestaurant, useAddToFoodCart, useFoodCart } from "@/lib/hooks/use-food";
import { usePopupStore } from "@/lib/stores/popup-store";
import { DetailSkeleton } from "@/components/ui/Skeleton";

const { width } = Dimensions.get("window");

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: restaurant, isLoading } = useFoodRestaurant(id ?? "");
  const { data: cartData } = useFoodCart();
  const addToCart = useAddToFoodCart();
  const showPopup = usePopupStore((s) => s.showPopup);

  const [activeCategory, setActiveCategory] = useState("");

  const cartItems = cartData?.items ?? [];
  const cartItemCount = cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce(
    (acc: number, item: any) => acc + Number(item.price) * item.quantity,
    0
  );

  // Map menu groups from API: food items grouped by category
  const menuGroups =
    restaurant?.menu ??
    (restaurant?.foodItems
      ? Object.entries(
          (restaurant.foodItems as any[]).reduce((acc: any, item: any) => {
            const cat = item.category ?? "General";
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
          }, {})
        ).map(([category, items]: [string, any]) => ({ category, items }))
      : []);

  // Set initial category when menu loads
  if (!activeCategory && menuGroups.length > 0) {
    setActiveCategory(menuGroups[0].category);
  }

  const handleAddToCart = (item: any) => {
    addToCart.mutate({ foodItemId: item.id, quantity: 1 });
    showPopup({
      type: "success",
      title: "Added to Cart",
      message: `${item.name} has been added to your food cart.`,
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <DetailSkeleton />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-display-sm font-heading font-black text-foreground">
            {restaurant?.shopName || "Restaurant"}
          </Text>
        </View>
      </View>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: cartItemCount > 0 ? 100 : 40 }}
      >
        {/* Header Image & Back Button */}
        <View className="relative w-full justify-end bg-foreground" style={{ height: 260 }}>
          {restaurant.banner ? (
            <Image
              source={{ uri: restaurant.banner }}
              style={{ position: "absolute", width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View className="absolute w-full h-full bg-secondary items-center justify-center">
              <Icon name="image" size={48} color="#94a3b8" />
            </View>
          )}

          <Pressable
            className="absolute right-4 w-10 h-10 rounded-full bg-card border border-border items-center justify-center z-20"
            style={({ pressed }) => [
              { opacity: pressed ? 0.7 : 1 },
              { top: Math.max(insets.top, 20) },
            ]}
          >
            <Icon name="search" size={20} color="#1e293b" />
          </Pressable>

          {/* Gradient overlay for text readability */}
          <View className="absolute bottom-0 left-0 right-0 h-40 bg-black/60 z-0" />

          <View className="p-5 z-10">
            <Text className="text-white font-heading font-black text-display-lg">
              {restaurant.shopName}
            </Text>
            <Text className="text-white/90 font-body text-body-md mt-1">
              {restaurant.description ?? "Restaurant"}
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <View className="bg-card rounded-2xl mx-5 -mt-6 p-5 border border-border mb-6 z-20">
          <View className="flex-row justify-between">
            <View className="items-center">
              <View className="flex-row items-center">
                <Icon name="map-pin" size={16} color="#64748b" />
                <Text className="text-body-lg font-bold text-foreground ml-1">
                  {restaurant.city ?? restaurant.address ?? "Accra"}
                </Text>
              </View>
              <Text className="text-body-sm text-muted-foreground mt-1">Location</Text>
            </View>
            <View className="w-[1px] bg-secondary" />
            <View className="items-center">
              <View className="flex-row items-center">
                <Icon name="shopping-bag" size={16} color="#64748b" />
                <Text className="text-body-lg font-bold text-foreground ml-1">
                  {restaurant._count?.foodItems ??
                    menuGroups.reduce((sum: number, g: any) => sum + g.items.length, 0)}
                </Text>
              </View>
              <Text className="text-body-sm text-muted-foreground mt-1">Menu Items</Text>
            </View>
            <View className="w-[1px] bg-secondary" />
            <View className="items-center">
              <View className="flex-row items-center">
                <Icon name="clock" size={16} color="#64748b" />
                <Text className="text-body-lg font-bold text-foreground ml-1">
                  {restaurant.hours?.length > 0
                    ? `${restaurant.hours[0].openTime ?? "09:00"}-${restaurant.hours[0].closeTime ?? "17:00"}`
                    : "Open"}
                </Text>
              </View>
              <Text className="text-body-sm text-muted-foreground mt-1">Hours</Text>
            </View>
          </View>
        </View>

        {/* Categories Tab Bar */}
        <View className="border-b border-border bg-background sticky top-0 z-20 pb-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 24 }}
          >
            {menuGroups.map((cat: any) => (
              <Pressable
                key={cat.category}
                onPress={() => setActiveCategory(cat.category)}
                className="pb-2 relative"
              >
                <Text
                  className={`text-body-lg font-bold ${activeCategory === cat.category ? "text-orange-600" : "text-muted-foreground"}`}
                >
                  {cat.category}
                </Text>
                {activeCategory === cat.category && (
                  <View className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-600" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Menu Items */}
        <View className="px-5 pt-6">
          {menuGroups.map((cat: any) => (
            <View
              key={cat.category}
              style={{ display: activeCategory === cat.category ? "flex" : "none" }}
            >
              <Text className="text-display-sm font-heading font-bold text-foreground mb-4">
                {cat.category}
              </Text>
              <View className="gap-4">
                {cat.items.map((item: any) => (
                  <View
                    key={item.id}
                    className="bg-card rounded-2xl p-4 border border-border flex-row justify-between"
                  >
                    <View className="flex-1 pr-4 justify-center">
                      <Text className="text-body-lg font-bold text-foreground mb-1 font-heading">
                        {item.name}
                      </Text>
                      <Text
                        className="text-sm text-muted-foreground mb-2 leading-tight font-body"
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                      <Text className="text-body-lg font-bold text-primary font-heading">
                        GHS {item.price.toFixed(2)}
                      </Text>
                    </View>

                    <View className="items-end">
                      <View className="w-20 h-20 bg-muted rounded-xl mb-3 items-center justify-center overflow-hidden">
                        <Icon name="image" size={24} color="#cbd5e1" />
                      </View>
                      <Pressable
                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                        className="bg-orange-50 px-4 py-1.5 rounded-full flex-row items-center gap-1"
                        onPress={() => handleAddToCart(item)}
                      >
                        <Icon name="plus" size={14} color="#ea580c" />
                        <Text className="text-sm font-bold text-orange-600">Add</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Cart Footer */}
      {cartItemCount > 0 && (
        <View className="absolute bottom-0 left-0 right-0 bg-card border-t border-border p-4 pb-8 shadow-2xl">
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
            className="bg-primary rounded-2xl flex-row justify-between items-center px-5 py-4"
            onPress={() => router.push("/(customer)/food-cart")}
          >
            <View className="flex-row items-center gap-3">
              <View className="bg-primary-hover w-8 h-8 rounded-full items-center justify-center">
                <Text className="text-white font-bold text-body-md">{cartItemCount}</Text>
              </View>
              <Text className="text-white font-bold text-body-lg">View Cart</Text>
            </View>
            <Text className="text-white font-bold text-body-lg">GHS {cartSubtotal.toFixed(2)}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
