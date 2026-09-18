import { tokens } from "@/theme/tokens";
import { BackButton } from "@/components/ui/BackButton";
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { FlashList as _FlashList } from "@shopify/flash-list";
const FlashList = _FlashList as any;
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useProducts } from "@/lib/hooks/use-products";

const RECENT_SEARCHES = ["Wireless Earbuds", "Sneakers size 42", "Hoodie navy", "Gaming Mouse"];
const TRENDING_TAGS = ["Campus Merch", "Food Delivery", "Textbooks", "Laptops", "Groceries"];
const SORT_OPTIONS = ["Recommended", "Price: Low to High", "Price: High to Low", "Top Rated"];

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState(RECENT_SEARCHES);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortOption, setSortOption] = useState(0);
  const [applyCount, setApplyCount] = useState(0);
  const {
    data: productsData,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProducts({ search: query || undefined });
  const rawResults = productsData?.pages?.flatMap((page: any) => page.data) ?? [];

  const results = useMemo(() => {
    let filtered = [...rawResults];
    if (applyCount > 0) {
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      if (!isNaN(min)) filtered = filtered.filter((p: any) => Number(p.price) >= min);
      if (!isNaN(max)) filtered = filtered.filter((p: any) => Number(p.price) <= max);
    }
    const sort = applyCount > 0 ? sortOption : 0;
    if (sort === 1) {
      filtered.sort((a: any, b: any) => Number(a.price) - Number(b.price));
    } else if (sort === 2) {
      filtered.sort((a: any, b: any) => Number(b.price) - Number(a.price));
    } else if (sort === 3) {
      filtered.sort((a: any, b: any) => Number(b.rating || 0) - Number(a.rating || 0));
    }
    return filtered;
  }, [rawResults, minPrice, maxPrice, sortOption, applyCount]);

  const applyFilters = () => {
    setApplyCount((c) => c + 1);
    setShowFilters(false);
  };

  const resetFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSortOption(0);
    setApplyCount(0);
    setShowFilters(false);
  };

  if (isError) {
    return (
      <View className="flex-1 bg-card">
        <View className="px-5 pb-4 pt-16 flex-row gap-3 items-center">
          <BackButton />
          <Text className="text-display-sm font-heading font-black text-foreground">Search</Text>
        </View>
        <ErrorState message="Failed to load search results." onRetry={refetch} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-card">
      {/* Search Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row gap-3 items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton />

        <View className="flex-1 flex-row items-center bg-background h-12 rounded-xl px-4 border border-border focus:border-primary">
          <Icon name="search" size={18} color={tokens.textMuted} />
          <TextInput
            className="flex-1 ml-2 text-body-lg font-body text-foreground h-full"
            placeholder="Search Bexiemart..."
            placeholderTextColor={tokens.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              onPress={() => setQuery("")}
            >
              <Icon name="x-circle" size={18} color={tokens.textMuted} />
            </Pressable>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filters"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          className={`w-12 h-12 rounded-xl items-center justify-center ${showFilters ? "bg-primary-subtle border border-border" : "bg-background border border-border"}`}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Icon
            name="sliders"
            size={20}
            color={showFilters ? tokens.primary : tokens.textPrimary}
          />
        </Pressable>
      </View>

      {query.length === 0 ? (
        <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
          {/* Recent Searches */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-body-lg font-heading font-bold text-foreground">
                Recent Searches
              </Text>
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                onPress={() => setRecentSearches([])}
              >
                <Text className="text-sm font-bold text-muted-foreground">Clear</Text>
              </Pressable>
            </View>
            <View className="gap-0">
              {recentSearches.map((item, idx) => (
                <Pressable
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  key={idx}
                  className="flex-row items-center py-3 border-b border-border"
                  onPress={() => setQuery(item)}
                >
                  <Icon name="clock" size={16} color={tokens.textMuted} />
                  <Text className="ml-3 text-body-lg font-body text-muted-foreground flex-1">
                    {item}
                  </Text>
                  <Icon name="arrow-up-left" size={16} color={tokens.textDisabled} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Trending Tags */}
          <View>
            <Text className="text-body-lg font-heading font-bold text-foreground mb-4">
              Trending Now
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {TRENDING_TAGS.map((tag, idx) => (
                <Pressable
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  key={idx}
                  className="px-4 py-2 bg-primary-subtle rounded-full border border-border"
                  onPress={() => setQuery(tag)}
                >
                  <Text className="text-sm font-bold text-primary font-body">{tag}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1">
          {isPending && rawResults.length === 0 ? (
            <View className="py-10">
              <LoadingState type="grid" message="Finding the best products for you..." />
            </View>
          ) : results.length === 0 ? (
            <View className="py-10">
              <EmptyState
                title="No results found"
                description={`We couldn't find any products matching "${query}".`}
                iconName="search"
                fullScreen={false}
              />
            </View>
          ) : (
            <>
              {/* @ts-ignore */}
              <FlashList
                data={results}
                estimatedItemSize={120}
                contentContainerStyle={{ padding: 20 }}
                onEndReached={() => {
                  if (hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                  }
                }}
                onEndReachedThreshold={0.5}
                ListHeaderComponent={
                  <Text className="text-body-md font-bold text-muted-foreground font-heading mb-4 px-1">
                    {`${results.length} Results for "${query}"`}
                  </Text>
                }
                ListFooterComponent={
                  isFetchingNextPage ? (
                    <View className="py-4 items-center">
                      <ActivityIndicator size="small" color={tokens.primary} />
                    </View>
                  ) : null
                }
                ItemSeparatorComponent={() => <View className="h-4" />}
                renderItem={({ item }: { item: any }) => (
                  <Pressable
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    className="flex-row items-center bg-card rounded-2xl p-4 border border-border"
                    onPress={() => router.push(`/(customer)/product/${item.id}` as any)}
                  >
                    <View className="w-20 h-20 rounded-xl bg-muted items-center justify-center overflow-hidden">
                      {item.image ? (
                        <Image
                          source={{ uri: item.image }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      ) : (
                        <Icon name="image" size={24} color={tokens.textDisabled} />
                      )}
                    </View>
                    <View className="flex-1 ml-4 justify-center">
                      <Text className="text-caption text-primary font-bold uppercase tracking-wide mb-1">
                        {item.vendor}
                      </Text>
                      <Text className="text-body-lg font-bold text-foreground font-heading mb-1">
                        {item.name}
                      </Text>
                      <View className="flex-row justify-between items-center mt-1">
                        <Text className="text-body-lg font-black text-foreground">
                          GHS {item.price.toFixed(2)}
                        </Text>
                        <View className="flex-row items-center gap-1">
                          <Icon name="star" size={12} color={tokens.warning} />
                          <Text className="text-body-sm font-bold text-muted-foreground">
                            {item.rating}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                )}
              />
            </>
          )}
        </View>
      )}

      {/* Filter Bottom Sheet */}
      {showFilters && (
        <View className="absolute inset-0 bg-black/40 justify-end z-50">
          <View
            className="bg-card rounded-t-3xl p-6"
            style={{ paddingBottom: Math.max(insets.bottom, 24) }}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-display-sm font-heading font-black text-foreground">
                Filter & Sort
              </Text>
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Close filters"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => setShowFilters(false)}
                className="w-8 h-8 rounded-full bg-muted items-center justify-center"
              >
                <Icon name="x" size={16} color={tokens.textPrimary} />
              </Pressable>
            </View>

            <Text className="text-body-md font-bold text-foreground font-heading mb-3">
              Price Range (GHS)
            </Text>
            <View className="flex-row gap-3 mb-6">
              <View className="flex-1 bg-background h-12 rounded-xl px-4 justify-center border border-border">
                <TextInput
                  className="text-body-lg font-body text-foreground"
                  placeholder="Min"
                  placeholderTextColor={tokens.textMuted}
                  keyboardType="numeric"
                  value={minPrice}
                  onChangeText={setMinPrice}
                />
              </View>
              <View className="flex-1 bg-background h-12 rounded-xl px-4 justify-center border border-border">
                <TextInput
                  className="text-body-lg font-body text-foreground"
                  placeholder="Max"
                  placeholderTextColor={tokens.textMuted}
                  keyboardType="numeric"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                />
              </View>
            </View>

            <Text className="text-body-md font-bold text-foreground font-heading mb-3">
              Sort By
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-8">
              {SORT_OPTIONS.map((sort, idx) => (
                <Pressable
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  key={idx}
                  className={`px-4 py-2 rounded-full border ${idx === sortOption ? "bg-foreground border-border" : "bg-card border-border"}`}
                  onPress={() => setSortOption(idx)}
                >
                  <Text
                    className={`text-sm font-bold ${idx === sortOption ? "text-white" : "text-muted-foreground"}`}
                  >
                    {sort}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="flex-row gap-3">
              <Button
                title="Reset"
                variant="outline"
                size="lg"
                className="flex-1 rounded-full"
                onPress={resetFilters}
              />
              <Button
                title="Apply Filters"
                size="lg"
                className="flex-1 rounded-full"
                onPress={applyFilters}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
