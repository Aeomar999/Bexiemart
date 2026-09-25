import { tokens } from "@/theme/tokens";
import { View, Text, ScrollView, Pressable, RefreshControl, TextInput } from "react-native";
import { FlashList as _FlashList } from "@shopify/flash-list";
const FlashList = _FlashList as any;
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
import { useFlashSalesEnabled } from "@/lib/feature-flags";

const EXPLORE_GRID = [
  {
    id: "1",
    name: "Food",
    icon: "coffee",
    bgColor: "#f8fafc",
    iconColor: "#ea580c",
    route: "/(customer)/food",
  },
  {
    id: "2",
    name: "Shop",
    icon: "shopping-bag",
    bgColor: "#f8fafc",
    iconColor: "#3b82f6",
    route: "/(customer)/(shop)",
  },
  {
    id: "3",
    name: "Ride",
    icon: "navigation",
    bgColor: "#f8fafc",
    iconColor: "#16a34a",
    route: "/(customer)/book-rider",
  },
  {
    id: "4",
    name: "Track",
    icon: "map-pin",
    bgColor: "#f8fafc",
    iconColor: "#9333ea",
    route: "/(customer)/track-order",
  },
  {
    id: "5",
    name: "Wallet",
    icon: "credit-card",
    bgColor: "#f8fafc",
    iconColor: "#ca8a04",
    route: "/(customer)/wallet",
  },
  {
    id: "6",
    name: "Reels",
    icon: "video",
    bgColor: "#f8fafc",
    iconColor: "#ef4444",
    route: "/(customer)/reels",
  },
  {
    id: "7",
    name: "Services",
    icon: "briefcase",
    bgColor: "#f8fafc",
    iconColor: "#8b5cf6",
    route: "/(customer)/services",
  },
  {
    id: "8",
    name: "Deals",
    icon: "tag",
    bgColor: "#f8fafc",
    iconColor: "#e11d48",
    route: "/(customer)/flash-sales",
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

function getCategoryAsset(name: string) {
  const n = name.toLowerCase();
  if (/beaut|health|cosmet|care|wellness|pharma/.test(n))
    return require("@assets/images/category-cards/No bg/category_beauty_health_pink_1790294230506.png");
  if (/book|stationer|office|paper/.test(n))
    return require("@assets/images/category-cards/No bg/category_books_stationery_mint_1790294240063.png");
  if (/comput|laptop|pc|mac/.test(n))
    return require("@assets/images/category-cards/No bg/category_computers_peach_1790294249335.png");
  if (/electron|phone|tablet|gadget|device|tech/.test(n))
    return require("@assets/images/category-cards/No bg/category_electronics_blue_1790294279063.png");
  if (/entertain|game|gaming|console|music|audio|sound|headphone|movie|tv/.test(n))
    return require("@assets/images/category-cards/No bg/category_entertainment_lavender_1790294287340.png");
  if (/fashion|cloth|apparel|wear|shoe|bag|accessor|jewel/.test(n))
    return require("@assets/images/category-cards/No bg/category_fashion_yellow_1790294294935.png");
  return null;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"top" | "new" | "popular">("top");

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
  const { flashSalesEnabled } = useFlashSalesEnabled();

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
        <View className="flex-row justify-between items-end mb-5">
          <View>
            <Text className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-[2px]">
              KNUST Campus
            </Text>
            <Text className="text-display-md font-heading font-black text-foreground">
              Bexiemart
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            className="w-[36px] h-[36px] rounded-full bg-background border border-border items-center justify-center"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push("/(customer)/notifications")}
          >
            <Icon name="bell" size={17} color={tokens.textSecondary} />
          </Pressable>
        </View>

        <SearchBar placeholder="Search products, stores..." showCamera={true} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 96 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.primary}
            colors={[tokens.primary]}
          />
        }
      >
        {/* ===== EXPLORE GRID (Quick Actions) ===== */}
        <View className="px-5 mt-6 mb-2">
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {EXPLORE_GRID.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                className="w-[23%] md:w-[11%] lg:w-[11%] items-center active:opacity-70"
                onPress={() => item.route !== "#" && router.push(item.route as any)}
              >
                <View
                  className="w-full rounded-[14px] items-center justify-center mb-1.5 bg-background border border-border"
                  style={{ aspectRatio: 1 }}
                >
                  <Icon name={item.icon} size={20} color={item.iconColor} />
                </View>
                <Text className="text-[11px] font-bold text-foreground font-heading">
                  {item.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

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

        {/* ===== CATEGORIES ===== */}
        <View className="px-5 mt-10">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-[12px] font-bold tracking-[0.1em] uppercase text-muted-foreground">
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
              const asset = getCategoryAsset(cat.name);
              return (
                <Pressable
                  key={cat.id}
                  className="w-[48%] md:w-[31%] lg:w-[23%] active:opacity-90"
                  onPress={() => goToShopWithCategory(cat.name)}
                  accessibilityRole="button"
                  accessibilityLabel={`${cat.name}, ${cat.count} ${cat.count === 1 ? "item" : "items"}`}
                >
                  <View
                    className="w-full rounded-2xl overflow-hidden p-3.5 justify-between"
                    style={{ aspectRatio: 1.1, backgroundColor: tint }}
                  >
                    {/* Big Watermark Title */}
                    <Text
                      pointerEvents="none"
                      className="font-heading font-black uppercase z-10"
                      style={{
                        fontSize: 32, // bump slightly since it will scale down anyway
                        color: fg,
                        opacity: 0.35,
                      }}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.3}
                    >
                      {cat.name}
                    </Text>

                    {/* Background illustration or fallback watermark */}
                    <View
                      pointerEvents="none"
                      style={
                        asset
                          ? {
                              position: "absolute",
                              right: -10,
                              bottom: -10,
                              width: 120,
                              height: 120,
                              zIndex: 5,
                            }
                          : {
                              position: "absolute",
                              right: -10,
                              bottom: -12,
                              opacity: 0.12,
                              zIndex: 5,
                            }
                      }
                    >
                      {asset ? (
                        <Image
                          source={asset}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="contain"
                        />
                      ) : (
                        <Icon name={icon} size={104} color={fg} />
                      )}
                    </View>

                    {/* Subtitle / Count */}
                    <View className="z-10 mt-auto pt-4">
                      <Text
                        className="text-caption font-body font-bold"
                        style={{ color: fg, opacity: 0.8 }}
                      >
                        {cat.count} {cat.count === 1 ? "item" : "items"}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ===== DISCOVER SECTION (MERGED) ===== */}
        <View className="pl-5 mt-10">
          <View className="flex-row justify-between items-center mb-6 pr-5">
            <View className="flex-row items-center bg-[#F1F5F9] rounded-[12px] p-[3px]">
              <Pressable
                onPress={() => setActiveTab("top")}
                className={`h-[34px] px-3 rounded-[9px] items-center justify-center ${activeTab === "top" ? "bg-white shadow-sm" : ""}`}
              >
                <Text
                  className={`text-[13px] font-bold ${activeTab === "top" ? "text-foreground" : "text-muted-foreground"}`}
                >
                  Top
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab("new")}
                className={`h-[34px] px-3 rounded-[9px] items-center justify-center ${activeTab === "new" ? "bg-white shadow-sm" : ""}`}
              >
                <Text
                  className={`text-[13px] font-bold ${activeTab === "new" ? "text-foreground" : "text-muted-foreground"}`}
                >
                  New
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab("popular")}
                className={`h-[34px] px-3 rounded-[9px] items-center justify-center ${activeTab === "popular" ? "bg-white shadow-sm" : ""}`}
              >
                <Text
                  className={`text-[13px] font-bold ${activeTab === "popular" ? "text-foreground" : "text-muted-foreground"}`}
                >
                  Popular
                </Text>
              </Pressable>
            </View>
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              onPress={() => router.push("/(customer)/(shop)")}
            >
              <Text className="text-[12px] font-bold text-muted-foreground">See All</Text>
            </Pressable>
          </View>
          {/* @ts-ignore */}
          <FlashList
            data={activeTab === "top" ? topProducts : activeTab === "new" ? newItems : mostPopular}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={152} // 140px width + 12px gap
            snapToAlignment="start"
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }: { item: any }) => (
              <Pressable
                className="w-[140px] active:opacity-70"
                onPress={() => router.push(`/(customer)/product/${item.id}`)}
              >
                <View className="w-full h-[120px] rounded-[16px] bg-muted mb-2 items-center justify-center overflow-hidden">
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : (
                    <Icon name="image" size={28} color={tokens.textDisabled} />
                  )}
                </View>
                <View className="px-1 gap-[4px]">
                  <Text
                    className="text-[14px] font-semibold text-foreground leading-[20px]"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-[14px] font-extrabold text-foreground tracking-tight flex-shrink pr-2"
                      style={{ fontVariant: ["tabular-nums"] }}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      GHS {item.price.toFixed(0)}
                    </Text>
                    <View className="flex-row items-center">
                      <Icon
                        name="star"
                        size={10}
                        color={tokens.warning}
                        style={{ marginRight: 2 }}
                      />
                      <Text className="text-caption font-bold text-muted-foreground">
                        {item.rating || "4.5"}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            )}
            estimatedItemSize={140}
          />
        </View>

        {/* ===== JUST FOR YOU ===== */}
        <View className="px-5 mt-10">
          <View className="flex-row items-center mb-6 gap-2">
            <Text className="text-[12px] font-bold tracking-[0.1em] uppercase text-muted-foreground">
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
                className="w-[48%] md:w-[31%] lg:w-[23%] active:opacity-70"
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
                    <Icon name="image" size={32} color={tokens.textDisabled} />
                  )}
                  <Pressable
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Toggle favorite"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-card/90 items-center justify-center"
                    onPress={() => {
                      toggleFavorite(item.id);
                    }}
                  >
                    <Icon
                      name="heart"
                      size={15}
                      color={isFavorite(item.id) ? tokens.error : tokens.textMuted}
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
    </View>
  );
}
