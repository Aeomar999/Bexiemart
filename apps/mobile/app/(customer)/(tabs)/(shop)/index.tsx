import { tokens } from "@/theme/tokens";
import { View, Text, ActivityIndicator, TextInput, Modal, Pressable } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useState, useMemo } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useProducts, useCategories } from "@/lib/hooks/use-products";
import { useAddToCart } from "@/lib/hooks/use-cart";
import { useRequireAuth } from "@/lib/hooks/use-require-auth";
import { useFavoritesStore } from "@/lib/stores/favorites-store";
import Toast from "@/lib/toast-polyfill";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";

type SortOption = "popular" | "newest" | "price-low" | "price-high";

export default function ShopScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ category?: string }>();
  const insets = useSafeAreaInsets();
  const {
    data: productsData,
    isPending: isProductsLoading,
    isError: isProductsError,
    refetch: refetchProducts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProducts();
  const {
    data: categoriesData,
    isPending: isCategoriesLoading,
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = useCategories();
  const addToCartMutation = useAddToCart();
  const requireAuth = useRequireAuth();
  const { isFavorite, toggleFavorite } = useFavoritesStore();

  const products = productsData?.pages.flatMap((page: any) => page.data) ?? [];
  const categories = categoriesData ?? [];

  const [activeCategoryFilter, setActiveCategoryFilter] = useState(searchParams.category ?? "All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [showSortModal, setShowSortModal] = useState(false);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (activeCategoryFilter !== "All") {
      filtered = filtered.filter((p) => p.category === activeCategoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(q) || p.vendor.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        filtered.reverse();
        break;
      default:
        break;
    }
    return filtered;
  }, [products, activeCategoryFilter, searchQuery, sortBy]);

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
    const added = !isFavorite(id);
    Toast.show({
      type: "success",
      text1: added ? "Added to Favorites" : "Removed from Favorites",
    });
  };

  const handleAddToCart = (product: any) => {
    // Guests (auth wall off) are prompted to sign in instead of adding.
    if (!requireAuth()) return;
    addToCartMutation.mutate({ productId: product.id, quantity: 1 });
    Toast.show({
      type: "success",
      text1: "Added to Cart",
      text2: `${product.name} added to your cart.`,
    });
  };

  const sortLabels: Record<SortOption, string> = {
    popular: "Most Popular",
    newest: "Newest First",
    "price-low": "Price: Low to High",
    "price-high": "Price: High to Low",
  };

  if (isProductsLoading || isCategoriesLoading) {
    return (
      <View className="flex-1 bg-background">
        <View
          className="px-5 pt-4 pb-4 bg-card border-b border-border"
          style={{ paddingTop: insets.top + 12 }}
        >
          <View className="flex-row items-center gap-3">
            <View className="flex-1 h-11 bg-muted rounded-full border border-border" />
            <View className="w-11 h-11 rounded-full bg-card border border-border" />
          </View>
          <View className="flex-row gap-2 mt-4">
            <View className="w-20 h-8 rounded-full bg-muted" />
            <View className="w-24 h-8 rounded-full bg-muted" />
            <View className="w-16 h-8 rounded-full bg-muted" />
          </View>
        </View>
        <View className="px-5 py-5 flex-row flex-wrap justify-between">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  if (isProductsError || isCategoriesError) {
    return (
      <ErrorState
        message="Failed to load products."
        onRetry={() => {
          refetchProducts();
          refetchCategories();
        }}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      import {ProductCard} from "@/components/ui/ProductCard"; // ... existing code ...
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
          </Text>
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="flex-row items-center gap-1 active:opacity-70"
            onPress={() => setShowSortModal(true)}
          >
            <Text className="text-[12px] font-bold text-muted-foreground">
              {sortLabels[sortBy]}
            </Text>
            <Icon name="chevron-down" size={10} color={tokens.textMuted} />
          </Pressable>
        </View>
        <View className="flex-row items-center gap-3">
          <View className="flex-1 flex-row items-center gap-2 bg-muted rounded-full px-4 h-11 border border-border">
            <Icon name="search" size={16} color={tokens.textMuted} />
            <TextInput
              className="flex-1 font-body text-body-sm text-foreground"
              placeholder="Search products..."
              placeholderTextColor={tokens.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== "" && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                onPress={() => setSearchQuery("")}
                className="active:opacity-70"
              >
                <Icon name="x" size={14} color={tokens.textMuted} />
              </Pressable>
            )}
          </View>
        </View>
        <FlashList<{ id: string; name: string }>
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          keyExtractor={(item) => item.id}
          className="mt-4"
          contentContainerStyle={{ gap: 10, paddingRight: 20 }}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className={`px-4 py-2 rounded-full ${
                activeCategoryFilter === item.name ? "bg-primary" : "bg-card border border-border"
              }`}
              onPress={() => setActiveCategoryFilter(item.name)}
            >
              <Text
                className={`text-body-sm font-bold font-body ${
                  activeCategoryFilter === item.name ? "text-white" : "text-muted-foreground"
                }`}
              >
                {item.name}
              </Text>
            </Pressable>
          )}
        />
      </View>
      <FlashList
        data={filteredProducts}
        numColumns={2}
        contentContainerStyle={[
          { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, gap: 12 },
          filteredProducts.length === 0 && { flexGrow: 1 },
        ]}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (hasNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4 items-center">
              <ActivityIndicator color={tokens.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            title="No products found"
            description="We couldn't find any products matching your search."
            iconName="search"
          />
        }
        renderItem={({ item }) => {
          return (
            <View className="flex-1 px-1.5">
              <ProductCard
                id={item.id}
                name={item.name}
                price={item.price}
                oldPrice={item.oldPrice}
                imageUrl={item.image}
                rating={item.rating}
                subtitle={item.vendor}
                isFavorite={isFavorite(item.id)}
                onPress={() => router.push(`/(customer)/product/${item.id}`)}
                onFavoriteToggle={() => handleToggleFavorite(item.id)}
                variant="vertical"
              />
            </View>
          );
        }}
      />
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setShowSortModal(false)}
        >
          <View
            className="bg-card rounded-t-3xl pt-6 pb-10 px-5"
            onStartShouldSetResponder={() => true}
          >
            <View className="w-10 h-1 bg-secondary rounded-full self-center mb-6" />
            <Text className="text-heading-sm font-heading font-bold text-foreground mb-5">
              Sort Products
            </Text>
            {(Object.keys(sortLabels) as SortOption[]).map((key) => (
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                key={key}
                className="flex-row items-center justify-between py-4 border-b border-border last:border-b-0 active:opacity-70"
                onPress={() => {
                  setSortBy(key);
                  setShowSortModal(false);
                }}
              >
                <Text
                  className={`text-body-md font-body ${sortBy === key ? "text-primary font-bold" : "text-muted-foreground"}`}
                >
                  {sortLabels[key]}
                </Text>
                {sortBy === key && <Icon name="check-circle" size={20} color={tokens.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
