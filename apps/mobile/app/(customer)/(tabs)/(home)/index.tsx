import { tokens } from "@/theme/tokens";
import { View, Text, ScrollView, Pressable, RefreshControl, TextInput } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useState, useCallback, useEffect } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, SearchBar, PromoBanner, StatusBanner } from "@/components/ui";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useProducts, useCategories } from "@/lib/hooks/use-products";
import { useFavoritesStore } from "@/lib/stores/favorites-store";
import { Product, Category } from "@/lib/stores/product-store";
import { useRiderStore } from "@/lib/stores/rider-store";
import { useCountdown } from "@/hooks/useCountdown";

const FILTER_PILLS = [
  { id: "1", label: "Instant Delivery", icon: "clock", iconColor: "#10b981", bgColor: "#f0fdf4" },
  { id: "2", label: "Featured Meals", icon: "activity", iconColor: "#ef4444", bgColor: "#fef2f2" },
  { id: "3", label: "New Arrivals", icon: "star", iconColor: "#3b82f6", bgColor: "#eff6ff" },
];

const FEATURED_HIGHLIGHTS = [
  {
    id: "1",
    name: "Shopping",
    icon: "shopping-bag",
    bgColor: "#fce7f3",
    iconColor: "#ec4899",
    route: "/(customer)/(shop)",
  },
  {
    id: "2",
    name: "Food",
    icon: "coffee",
    bgColor: "#dcfce7",
    iconColor: "#22c55e",
    route: "/(customer)/food",
  },
  {
    id: "3",
    name: "Delivery",
    icon: "truck",
    bgColor: "#ffedd5",
    iconColor: "#f97316",
    route: "/(customer)/book-rider",
  },
  {
    id: "4",
    name: "Finance",
    icon: "dollar-sign",
    bgColor: "#dbeafe",
    iconColor: "#2563eb",
    route: "/(customer)/wallet",
  },
  {
    id: "5",
    name: "Reels",
    icon: "video",
    bgColor: "#fee2e2",
    iconColor: "#ef4444",
    route: "/(customer)/reels",
  },
  {
    id: "6",
    name: "Services",
    icon: "briefcase",
    bgColor: "#f3e8ff",
    iconColor: "#8b5cf6",
    route: "/(customer)/services",
  },
];

const SHOPS = [
  { id: "1", name: "Jean Collections", desc: "Bags, Shoes, Dresses", rating: 4.8, image: "" },
  { id: "2", name: "KFC Ghana", desc: "Burger, Chicken, Fries", rating: 4.8, image: "" },
];

const QUICK_ACTIONS = [
  {
    id: "1",
    label: "Order\nFood",
    icon: "coffee",
    bgColor: "#f8fafc",
    iconColor: "#ea580c",
    route: "/(customer)/food",
  },
  {
    id: "2",
    label: "Shop\nProducts",
    icon: "shopping-bag",
    bgColor: "#f8fafc",
    iconColor: "#3b82f6",
    route: "/(customer)/(shop)",
  },
  {
    id: "3",
    label: "Book\nRider",
    icon: "navigation",
    bgColor: "#f8fafc",
    iconColor: "#16a34a",
    route: "/(customer)/book-rider",
  },
  {
    id: "4",
    label: "Track\nOrder",
    icon: "map-pin",
    bgColor: "#f8fafc",
    iconColor: "#9333ea",
    route: "/(customer)/track-order",
  },
  {
    id: "5",
    label: "Wallet",
    icon: "credit-card",
    bgColor: "#f8fafc",
    iconColor: "#ca8a04",
    route: "/(customer)/wallet",
  },
];

// Soft, on-brand tint + foreground pairs for category tiles. Reused hue family
// from FEATURED_HIGHLIGHTS so the home screen keeps one palette. Assigned by
// position so the visible grid always shows varied, non-repeating colors.
const CATEGORY_PALETTE = [
  { tint: "#FCE7F3", fg: "#DB2777" }, // rose
  { tint: "#DCFCE7", fg: "#16A34A" }, // green
  { tint: "#FFEDD5", fg: "#EA580C" }, // orange
  { tint: "#DBEAFE", fg: "#2563EB" }, // blue
  { tint: "#F3E8FF", fg: "#7C3AED" }, // violet
  { tint: "#FEF3C7", fg: "#D97706" }, // amber
  { tint: "#CCFBF1", fg: "#0D9488" }, // teal
  { tint: "#FFE4E6", fg: "#E11D48" }, // raspberry
] as const;

// Maps a category name to a semantic Feather icon. Keyword-matched with a
// neutral "grid" fallback so an unknown category still renders a clean glyph
// instead of a broken image placeholder.
function getCategoryIcon(name: string): string {
  const n = name.toLowerCase();
  if (/beaut|health|cosmet|care|wellness|pharma/.test(n)) return "heart";
  if (/book|stationer|office|paper/.test(n)) return "book";
  if (/electron|phone|tablet|comput|gadget|laptop|device|tech/.test(n)) return "smartphone";
  if (/fashion|cloth|apparel|wear|shoe|bag|accessor|jewel/.test(n)) return "shopping-bag";
  if (/food|grocer|drink|beverage|snack|fresh/.test(n)) return "coffee";
  if (/home|furnitur|kitchen|decor|living|garden/.test(n)) return "home";
  if (/sport|fitness|outdoor|gym|bike/.test(n)) return "activity";
  if (/toy|baby|kid|child/.test(n)) return "gift";
  if (/auto|\bcar\b|vehicle|motor/.test(n)) return "truck";
  if (/game|gaming|console/.test(n)) return "monitor";
  if (/music|audio|sound|headphone/.test(n)) return "headphones";
  if (/tool|hardware|diy|build|construct|industrial/.test(n)) return "tool";
  return "grid";
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: productsData,
    isPending: isProductsLoading,
    isError: isProductsError,
    refetch: refetchProducts,
  } = useProducts();
  const {
    data: categoriesData,
    isPending: isCategoriesLoading,
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = useCategories();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProducts(), refetchCategories()]);
    setRefreshing(false);
  }, [refetchProducts, refetchCategories]);

  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const activeRide = useRiderStore((s) => s.activeRide);

  const allProducts = productsData?.pages?.flatMap((page: any) => page.data) ?? [];
  const categories = categoriesData ?? [];
  const topProducts = allProducts.slice(0, 5);
  const newItems = allProducts.filter((p: Product) => p.tags?.includes("New")).slice(0, 5);
  const flashSale = allProducts
    .filter((p: Product) => p.oldPrice && p.oldPrice > p.price)
    .slice(0, 6);
  const mostPopular = [...allProducts].sort((a, b) => b.rating - a.rating).slice(0, 6);
  const justForYou = allProducts.slice(10, 14);

  // Target end of day for flash sale
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const { hours, minutes, seconds } = useCountdown(endOfDay);

  const goToShopWithCategory = (categoryName: string) => {
    router.push(`/(customer)/(shop)?category=${encodeURIComponent(categoryName)}`);
  };

  if (isProductsLoading || isCategoriesLoading) {
    return <LoadingState type="grid" message="Loading BexieMart..." />;
  }

  if (isProductsError || isCategoriesError) {
    return <ErrorState message="Failed to load store data." onRetry={onRefresh} />;
  }

  return (
    <View className="flex-1 bg-card">
      {/* ===== HEADER ===== */}
      <View className="px-5 bg-card pb-3" style={{ paddingTop: (insets.top || 12) + 12 }}>
        <View className="flex-row justify-between items-center mb-5">
          {/* NOTE: renders a hamburger but navigates to the profile tab — icon
              and destination should be reconciled (product call). Label reflects
              what actually happens so screen readers aren't misled. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-10 h-10 justify-center active:opacity-70"
            onPress={() => router.push("/(customer)/profile")}
          >
            <Icon name="menu" size={24} color="#0f172a" />
          </Pressable>

          <Text className="text-display-sm font-heading font-black text-foreground tracking-tight">
            Bexiemart
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-10 h-10 items-end justify-center active:opacity-70"
            onPress={() => router.push("/(customer)/notifications")}
          >
            <Icon name="bell" size={22} color="#0f172a" />
          </Pressable>
        </View>

        <SearchBar placeholder="Search products, stores..." showCamera={true} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-40"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.primary}
          />
        }
      >
        {/* ===== HERO BANNER ===== */}
        <PromoBanner placement="HOME" containerClassName="mt-4" />

        {/* ===== ACTIVE RIDE BANNER ===== */}
        {activeRide && (
          <StatusBanner
            className="px-5 mt-6"
            icon="map"
            title="Delivery in progress"
            subtitle={
              activeRide.status === "searching"
                ? "Locating your rider..."
                : activeRide.status === "on_the_way"
                  ? "Your rider is arriving"
                  : "Rider is outside"
            }
            actionLabel="Track"
            onPress={() => router.push("/(customer)/track-order")}
          />
        )}

        {/* ===== FILTER PILLS ===== */}
        <FlashList
          data={FILTER_PILLS}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-6"
          estimatedItemSize={120}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                backgroundColor: item.bgColor,
              })}
              onPress={() => router.push("/(customer)/(shop)")}
              className="flex-row items-center px-4 py-2.5 rounded-xl"
            >
              <Icon name={item.icon} size={14} color={item.iconColor} />
              <Text className="ml-2 font-semibold text-foreground text-sm font-body">
                {item.label}
              </Text>
            </Pressable>
          )}
        />

        {/* ===== FEATURED HIGHLIGHTS ===== */}
        <View className="px-5 mt-8">
          <Text className="text-heading-md font-heading font-bold text-foreground mb-5">
            Featured Highlights
          </Text>
          <View className="flex-row flex-wrap justify-between gap-y-5">
            {FEATURED_HIGHLIGHTS.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                className="w-[30%] items-center active:opacity-70"
                onPress={() => item.route !== "#" && router.push(item.route as any)}
              >
                <View
                  className="w-full rounded-2xl items-center justify-center mb-2"
                  style={[{ aspectRatio: 1 }, { backgroundColor: item.bgColor }]}
                >
                  <Icon name={item.icon} size={32} color={item.iconColor} />
                </View>
                <Text className="text-sm font-bold text-foreground font-heading">{item.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ===== CATEGORIES ===== */}
        <View className="px-5 mt-10">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-heading-md font-heading font-bold text-foreground">
              Categories
            </Text>
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push("/(customer)/(shop)")}
            >
              <Text className="text-body-sm font-bold text-muted-foreground">See All</Text>
            </Pressable>
          </View>
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {categories.slice(0, 6).map((cat: Category, index: number) => {
              const { tint, fg } = CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
              const icon = getCategoryIcon(cat.name);
              return (
                <Pressable
                  key={cat.id}
                  className="w-[48%] active:opacity-90"
                  onPress={() => goToShopWithCategory(cat.name)}
                  accessibilityRole="button"
                  accessibilityLabel={`${cat.name}, ${cat.count} ${cat.count === 1 ? "item" : "items"}`}
                >
                  <View
                    className="w-full rounded-2xl overflow-hidden p-3.5 justify-between"
                    style={{ aspectRatio: 1.1, backgroundColor: tint }}
                  >
                    {/* Brand-tinted glyph watermark for texture + per-tile identity */}
                    <View
                      pointerEvents="none"
                      style={{ position: "absolute", right: -10, bottom: -12, opacity: 0.12 }}
                    >
                      <Icon name={icon} size={104} color={fg} />
                    </View>

                    {/* Medallion: real category image when present, icon fallback otherwise */}
                    <View
                      className="w-12 h-12 rounded-2xl bg-card items-center justify-center overflow-hidden"
                      style={{
                        shadowColor: "#0f172a",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 3,
                      }}
                    >
                      {cat.image ? (
                        <Image
                          source={{ uri: cat.image }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      ) : (
                        <Icon name={icon} size={22} color={fg} />
                      )}
                    </View>

                    <View>
                      <Text
                        className="text-body-md font-heading font-bold text-foreground"
                        numberOfLines={1}
                      >
                        {cat.name}
                      </Text>
                      <Text className="text-caption font-body text-muted-foreground mt-0.5">
                        {cat.count} {cat.count === 1 ? "item" : "items"}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ===== TOP PRODUCTS ===== */}
        <View className="pl-5 mt-10">
          <View className="flex-row justify-between items-center mb-4 pr-5">
            <Text className="text-heading-md font-heading font-bold text-foreground">
              Top Products
            </Text>
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push("/(customer)/(shop)")}
            >
              <Text className="text-body-sm font-bold text-muted-foreground">See All</Text>
            </Pressable>
          </View>
          <FlashList
            data={topProducts}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={88} // 72px width + 16px gap
            snapToAlignment="start"
            estimatedItemSize={72}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                className="items-center active:opacity-70"
                onPress={() => router.push(`/(customer)/product/${item.id}`)}
              >
                <View className="w-18 h-18 rounded-full bg-muted mb-2 items-center justify-center border-2 border-card shadow-sm overflow-hidden">
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : (
                    <Icon name="image" size={24} color="#cbd5e1" />
                  )}
                </View>
                <Text className="text-caption font-bold text-foreground" numberOfLines={1}>
                  {item.name.substring(0, 10)}
                </Text>
              </Pressable>
            )}
          />
        </View>

        {/* ===== NEW ITEMS ===== */}
        {newItems.length > 0 && (
          <View className="pl-5 mt-10">
            <View className="flex-row justify-between items-center mb-4 pr-5">
              <Text className="text-heading-md font-heading font-bold text-foreground">
                New Items
              </Text>
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="flex-row items-center gap-1 active:opacity-70"
                onPress={() => router.push("/(customer)/(shop)")}
              >
                <Text className="text-body-sm font-bold text-muted-foreground">See All</Text>
                <View className="w-5 h-5 rounded-full bg-foreground items-center justify-center">
                  <Icon name="arrow-right" size={12} color="#fff" />
                </View>
              </Pressable>
            </View>
            <FlashList
              data={newItems}
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={156} // 140px width + 16px gap
              snapToAlignment="start"
              estimatedItemSize={140}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  className="w-[140px] active:opacity-70"
                  onPress={() => router.push(`/(customer)/product/${item.id}`)}
                >
                  <View
                    className="w-full rounded-xl bg-muted mb-2 items-center justify-center overflow-hidden"
                    style={{ aspectRatio: 1 }}
                  >
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    ) : (
                      <Icon name="image" size={32} color="#cbd5e1" />
                    )}
                  </View>
                  <Text className="text-body-md font-bold text-foreground" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text
                    className="text-caption text-muted-foreground font-body mb-1"
                    numberOfLines={1}
                  >
                    {item.subtitle || item.category}
                  </Text>
                  <Text className="text-body-md font-bold text-foreground">
                    GHS {item.price.toFixed(2)}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        )}

        {/* ===== FLASH SALE ===== */}
        {flashSale.length > 0 && (
          <View className="px-5 mt-10">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-heading-md font-heading font-bold text-foreground">
                Flash Sale
              </Text>
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="flex-row items-center gap-1.5 active:opacity-70"
                onPress={() => router.push("/(customer)/flash-sales")}
              >
                <Icon name="clock" size={14} color="#0f172a" />
                <View className="bg-muted px-1.5 py-0.5 rounded">
                  <Text className="text-caption font-bold text-error">{hours}</Text>
                </View>
                <View className="bg-muted px-1.5 py-0.5 rounded">
                  <Text className="text-caption font-bold text-error">{minutes}</Text>
                </View>
                <View className="bg-muted px-1.5 py-0.5 rounded">
                  <Text className="text-caption font-bold text-error">{seconds}</Text>
                </View>
                <Icon name="chevron-right" size={16} color="#0f172a" />
              </Pressable>
            </View>
            <View className="flex-row flex-wrap justify-between gap-y-4">
              {flashSale.map((item: Product) => {
                const discount = Math.round((1 - item.price / item.oldPrice) * 100);
                return (
                  <Pressable
                    key={item.id}
                    className="w-[31%] rounded-lg bg-muted relative items-center justify-center active:opacity-70 overflow-hidden"
                    style={{ aspectRatio: 1 }}
                    onPress={() => router.push(`/(customer)/product/${item.id}`)}
                  >
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={{ width: "100%", height: "100%", position: "absolute" }}
                        contentFit="cover"
                      />
                    ) : (
                      <Icon name="image" size={24} color="#cbd5e1" />
                    )}
                    <View className="absolute top-1 right-1 bg-error px-1.5 py-0.5 rounded-sm">
                      <Text className="text-caption font-bold text-white">-{discount}%</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ===== MOST POPULAR ===== */}
        <View className="pl-5 mt-10">
          <View className="flex-row justify-between items-center mb-4 pr-5">
            <Text className="text-heading-md font-heading font-bold text-foreground">
              Most Popular
            </Text>
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push("/(customer)/(shop)")}
            >
              <Text className="text-body-sm font-bold text-muted-foreground">See All</Text>
            </Pressable>
          </View>
          <FlashList
            data={mostPopular}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={122} // 110px width + 12px gap
            snapToAlignment="start"
            estimatedItemSize={110}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                className="w-[110px] active:opacity-70"
                onPress={() => router.push(`/(customer)/product/${item.id}`)}
              >
                <View className="w-full h-[150px] rounded-xl bg-muted mb-2 items-center justify-center overflow-hidden">
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : (
                    <Icon name="image" size={28} color="#cbd5e1" />
                  )}
                </View>
                <View className="flex-row justify-between items-center px-1">
                  <View className="flex-row items-center">
                    <Text className="text-body-sm font-bold text-foreground">
                      GHS {item.price.toFixed(0)}
                    </Text>
                    <Icon name="star" size={10} color="#f59e0b" style={{ marginLeft: 4 }} />
                  </View>
                  <Text className="text-caption text-muted-foreground">{item.rating}</Text>
                </View>
              </Pressable>
            )}
          />
        </View>

        {/* ===== JUST FOR YOU ===== */}
        <View className="px-5 mt-10">
          <View className="flex-row items-center mb-4 gap-2">
            <Text className="text-heading-md font-heading font-bold text-foreground">
              Just For You
            </Text>
            <View className="bg-primary-subtle px-2 py-0.5 rounded-md border border-border flex-row items-center gap-1">
              <Icon name="zap" size={10} color={tokens.primary} />
              <Text className="text-caption font-bold text-primary uppercase tracking-wider">
                Personalized
              </Text>
            </View>
          </View>
          <View className="flex-row flex-wrap justify-between gap-y-5">
            {justForYou.map((item: Product) => (
              <Pressable
                key={item.id}
                className="w-[48%] active:opacity-70"
                onPress={() => router.push(`/(customer)/product/${item.id}`)}
              >
                <View
                  className="w-full rounded-xl bg-muted mb-2 items-center justify-center relative overflow-hidden"
                  style={{ aspectRatio: 0.8 }}
                >
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : (
                    <Icon name="image" size={32} color="#cbd5e1" />
                  )}
                  <Pressable
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Toggle favorite"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-card/90 items-center justify-center shadow-sm"
                    onPress={() => {
                      toggleFavorite(item.id);
                    }}
                  >
                    <Icon
                      name="heart"
                      size={15}
                      color={isFavorite(item.id) ? "#ef4444" : "#64748b"}
                    />
                  </Pressable>
                </View>
                <Text className="text-body-md font-bold text-foreground" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text
                  className="text-caption text-muted-foreground font-body mb-1"
                  numberOfLines={1}
                >
                  {item.vendor}
                </Text>
                <Text className="text-body-md font-bold text-foreground">
                  GHS {item.price.toFixed(2)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ===== QUICK ACTIONS (Floating) ===== */}
      <View
        style={{ position: "absolute", bottom: 24, left: 20, right: 20 }}
        pointerEvents="box-none"
      >
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 32,
            padding: 20,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderWidth: 1,
            borderColor: "#f1f5f9",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.08,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => router.push(action.route as any)}
              style={{ alignItems: "center", width: "18%" }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                  backgroundColor: action.bgColor,
                }}
              >
                <Icon name={action.icon} size={22} color={action.iconColor} />
              </View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: "#0f172a",
                  textAlign: "center",
                  lineHeight: 12,
                }}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
