import { tokens } from "@/theme/tokens";
import { View, Text, FlatList, Pressable, RefreshControl, ScrollView } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "@/components/ui/BackButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Image } from "expo-image";
import { Icon } from "@/components/ui/Icon";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useCartStore } from "@/lib/stores/cart-store";
import { useWishlist, useToggleWishlist } from "@/lib/hooks/use-wishlist";
import {
  useCollections,
  useCollection,
  useRemoveCollectionItem,
} from "@/lib/hooks/use-collections";
import Toast from "@/lib/toast-polyfill";
import { CreateCollectionModal } from "@/components/screens/CreateCollectionModal";
import { AddToCollectionModal } from "@/components/screens/AddToCollectionModal";

export default function FavoritesScreen() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const insets = useSafeAreaInsets();

  const {
    data: allFavorites = [],
    isLoading: isLoadingWishlist,
    refetch: refetchWishlist,
  } = useWishlist();
  const {
    data: collections = [],
    isLoading: isLoadingCollections,
    refetch: refetchCollections,
  } = useCollections();

  const toggleWishlist = useToggleWishlist();
  const removeCollectionItem = useRemoveCollectionItem();

  const [activeCollectionId, setActiveCollectionId] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const { data: activeCollectionData, isLoading: isLoadingCollection } =
    useCollection(activeCollectionId);

  // If "all" is selected, use wishlist. If a specific collection is selected, extract its products.
  const displayItems =
    activeCollectionId === "all"
      ? (Array.isArray(allFavorites) ? allFavorites : []).map((w: any) => w.product || w)
      : (activeCollectionData?.items || []).map((item: any) => item.product);

  const isLoading = isLoadingWishlist || isLoadingCollections || isLoadingCollection;

  const handleRefresh = () => {
    refetchWishlist();
    refetchCollections();
  };

  const handleShowAddMenu = (productId: string) => {
    setSelectedProductId(productId);
    setShowAddModal(true);
  };

  const handleRemove = (productId: string) => {
    if (activeCollectionId === "all") {
      toggleWishlist.mutate(productId);
    } else {
      removeCollectionItem.mutate({ collectionId: activeCollectionId, productId });
    }
  };

  const handleAddToCart = (product: any) => {
    addItem({
      id: Date.now().toString(),
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      stock: product.stock || 10,
    });
    setAddedItems((prev) => {
      const n = new Set(prev);
      n.add(product.id);
      return n;
    });
    setTimeout(() => {
      setAddedItems((prev) => {
        const n = new Set(prev);
        n.delete(product.id);
        return n;
      });
    }, 2000);
  };

  if (isLoading && !displayItems.length && !collections.length) {
    return (
      <View
        className="flex-1 bg-background items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <ListSkeleton />
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
          <View className="flex-1">
            <Text className="text-display-sm font-heading font-black text-foreground">
              Collections
            </Text>
            <Text className="text-body-sm text-muted-foreground font-body mt-0.5">
              {displayItems.length} saved item{displayItems.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create collection"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="w-10 h-10 rounded-full bg-primary-subtle border border-border items-center justify-center"
            onPress={() => setShowCreateModal(true)}
          >
            <Icon name="folder-plus" size={18} color={tokens.primary} />
          </Pressable>
        </View>

        {/* Collection Folders */}
        <View className="mt-6">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20, gap: 12 }}
          >
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className={`px-4 py-2 rounded-full border ${activeCollectionId === "all" ? "bg-foreground border-foreground" : "bg-card border-border"}`}
              onPress={() => setActiveCollectionId("all")}
            >
              <Text
                className={`text-sm font-bold ${activeCollectionId === "all" ? "text-white" : "text-muted-foreground"}`}
              >
                All Items ({allFavorites.length})
              </Text>
            </Pressable>

            {collections.map((collection: any) => (
              <Pressable
                key={collection.id}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className={`px-4 py-2 rounded-full border flex-row items-center gap-2 ${activeCollectionId === collection.id ? "bg-foreground border-foreground" : "bg-card border-border"}`}
                onPress={() => setActiveCollectionId(collection.id)}
              >
                <Icon
                  name="folder"
                  size={14}
                  color={activeCollectionId === collection.id ? "#fff" : "#94a3b8"}
                />
                <Text
                  className={`text-sm font-bold ${activeCollectionId === collection.id ? "text-white" : "text-muted-foreground"}`}
                >
                  {collection.name} ({collection._count.items})
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      <FlatList
        data={displayItems as any[]}
        numColumns={2}
        contentContainerStyle={[
          { paddingHorizontal: 20, paddingBottom: 30, gap: 14, paddingTop: 20 },
          displayItems.length === 0 && { flexGrow: 1 },
        ]}
        columnWrapperStyle={{ gap: 14 }}
        keyExtractor={(item: any) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={tokens.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            iconName="folder"
            title="Empty Collection"
            description="You don't have any products saved here yet."
            actionLabel="Browse Products"
            onAction={() => router.push("/(customer)/(tabs)/(shop)")}
          />
        }
        renderItem={({ item }: { item: any }) => {
          const wasAdded = addedItems.has(item.id);
          return (
            <Pressable
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              className="flex-1 bg-card rounded-2xl overflow-hidden border border-border pb-3"
              onPress={() => router.push(`/(customer)/product/${item.id}`)}
            >
              <View
                className="w-full bg-muted items-center justify-center relative overflow-hidden"
                style={{ aspectRatio: 0.8 }}
              >
                {item.images?.[0]?.url || item.image ? (
                  <Image
                    source={{ uri: item.images?.[0]?.url || item.image }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                ) : (
                  <Icon name="image" size={32} color="#cbd5e1" />
                )}
                {activeCollectionId === "all" && collections.length > 0 && (
                  <Pressable
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Add to collection"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="absolute top-2 right-12 w-8 h-8 rounded-full bg-card/90 items-center justify-center"
                    onPress={() => handleShowAddMenu(item.id)}
                  >
                    <Icon name="folder-plus" size={15} color={tokens.primary} />
                  </Pressable>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    activeCollectionId === "all"
                      ? "Remove from favorites"
                      : "Remove from collection"
                  }
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-card/90 items-center justify-center"
                  onPress={() => handleRemove(item.id)}
                >
                  <Icon
                    name={activeCollectionId === "all" ? "heart" : "x"}
                    size={15}
                    color="#ef4444"
                  />
                </Pressable>
              </View>
              <View className="p-3">
                <Text className="text-caption text-primary font-bold font-body uppercase tracking-wide">
                  {item.vendor?.shopName || item.vendor || "VENDOR"}
                </Text>
                <Text
                  className="text-body-sm font-semibold text-foreground font-body mt-1"
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                <View className="flex-row items-center justify-between mt-3">
                  <View>
                    <Text className="text-heading-sm font-bold text-primary font-heading">
                      GHS {Number(item.price).toFixed(2)}
                    </Text>
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <Icon name="star" size={10} color="#f59e0b" />
                      <Text className="text-caption text-muted-foreground font-body">
                        {item.rating || "0.0"}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={wasAdded ? "Added to cart" : "Add to cart"}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    className={`w-9 h-9 rounded-full ${wasAdded ? "bg-emerald-500" : "bg-primary"} items-center justify-center active:scale-95`}
                    onPress={() => handleAddToCart(item)}
                  >
                    <Icon name={wasAdded ? "check-circle" : "plus"} size={16} color="#fff" />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          );
        }}
      />

      <CreateCollectionModal visible={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <AddToCollectionModal
        visible={showAddModal}
        productId={selectedProductId}
        onClose={() => setShowAddModal(false)}
      />
    </View>
  );
}
