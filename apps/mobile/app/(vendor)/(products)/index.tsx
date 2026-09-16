import { tokens } from "@/theme/tokens";
import { Image } from "expo-image";
import { View, Text, FlatList, Pressable, Modal } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVendorProducts } from "@/lib/hooks/use-vendor";
import { useVendorServices } from "@/lib/hooks/use-vendor-services";
import { useFoodItems } from "@/lib/hooks/use-food";
import { ProductCard } from "@/components/ui/ProductCard";
import { SearchBar } from "@/components/ui/SearchBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { ListSkeleton } from "@/components/ui/Skeleton";

const PRODUCT_FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "out_of_stock", label: "Out of Stock" },
  { id: "draft", label: "Drafts" },
];

const SERVICE_FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "paused", label: "Paused" },
  { id: "draft", label: "Drafts" },
];

const FOOD_FILTERS = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "sold_out", label: "Sold Out" },
  { id: "draft", label: "Drafts" },
];

export default function ListingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"products" | "food" | "services">("products");
  const [filter, setFilter] = useState("all");
  const [isAddModalVisible, setAddModalVisible] = useState(false);

  // When switching tabs, reset filter
  const handleTabSwitch = (tab: "products" | "food" | "services") => {
    setActiveTab(tab);
    setFilter("all");
  };

  const { data: products = [], isLoading: productsLoading } = useVendorProducts();
  const { data: services = [], isLoading: servicesLoading } = useVendorServices();
  const { data: food = [], isLoading: foodLoading } = useFoodItems({});

  const activeFilters =
    activeTab === "products"
      ? PRODUCT_FILTERS
      : activeTab === "food"
        ? FOOD_FILTERS
        : SERVICE_FILTERS;
  const activeData = activeTab === "products" ? products : activeTab === "food" ? food : services;
  const isLoading =
    activeTab === "products"
      ? productsLoading
      : activeTab === "food"
        ? foodLoading
        : servicesLoading;

  const filteredItems = activeData.filter((item: any) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  return (
    <View className="flex-1 bg-background">
      {/* Header & Search */}
      <View
        className="bg-card px-5 pt-4 pb-2 border-b border-border"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-display-md font-heading font-black text-foreground">
            My Listings
          </Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="w-10 h-10 bg-primary rounded-full items-center justify-center"
            onPress={() => setAddModalVisible(true)}
          >
            <Icon name="plus" size={20} color={tokens.primaryText} />
          </Pressable>
        </View>

        {/* Segmented Control */}
        <View className="flex-row bg-muted p-1 rounded-xl mb-4">
          <Pressable
            onPress={() => handleTabSwitch("products")}
            className={`flex-1 py-2 items-center justify-center rounded-lg ${activeTab === "products" ? "bg-card border border-border" : ""}`}
          >
            <Text
              className={`text-sm font-bold ${activeTab === "products" ? "text-foreground" : "text-muted-foreground"}`}
            >
              Products
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleTabSwitch("food")}
            className={`flex-1 py-2 items-center justify-center rounded-lg ${activeTab === "food" ? "bg-card border border-border" : ""}`}
          >
            <Text
              className={`text-sm font-bold ${activeTab === "food" ? "text-foreground" : "text-muted-foreground"}`}
            >
              Food
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleTabSwitch("services")}
            className={`flex-1 py-2 items-center justify-center rounded-lg ${activeTab === "services" ? "bg-card border border-border" : ""}`}
          >
            <Text
              className={`text-sm font-bold ${activeTab === "services" ? "text-foreground" : "text-muted-foreground"}`}
            >
              Services
            </Text>
          </Pressable>
        </View>

        {/* Search & Filters */}
        <View className="flex-row items-center gap-3 pb-2 h-12">
          <View className="flex-1 max-w-[140px]">
            <SearchBar placeholder="Search..." showCamera={false} />
          </View>
          <View className="flex-1 h-full">
            <FlatList
              data={activeFilters}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 20 }}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => setFilter(item.id)}
                  className={`px-4 h-full justify-center rounded-full border ${
                    filter === item.id ? "bg-foreground border-border" : "bg-card border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      filter === item.id ? "text-white" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ListSkeleton />
        </View>
      ) : filteredItems.length === 0 ? (
        <View className="flex-1 justify-center px-5">
          <EmptyState
            iconName={
              activeTab === "products" ? "package" : activeTab === "food" ? "coffee" : "briefcase"
            }
            title={`No ${activeTab} found`}
            description={
              filter === "all"
                ? `You haven't added any ${activeTab} yet.`
                : `You have no ${filter.replace("_", " ")} ${activeTab}.`
            }
            actionLabel={`Add ${activeTab === "products" ? "Product" : activeTab === "food" ? "Food Item" : "Service"}`}
            onAction={() => setAddModalVisible(true)}
          />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: any) => {
            const subtitle =
              activeTab === "products"
                ? `${item.stock} in stock • ${item.category}`
                : activeTab === "food"
                  ? `${item.prepTime} • ${item.category}`
                  : `${item.duration} • ${item.category}`;

            const statusColors: Record<string, { bg: string; text: string }> = {
              active: { bg: "bg-emerald-100", text: "text-emerald-700" },
              draft: { bg: "bg-gray-100", text: "text-gray-700" },
              out_of_stock: { bg: "bg-red-100", text: "text-red-700" },
              sold_out: { bg: "bg-red-100", text: "text-red-700" },
              paused: { bg: "bg-amber-100", text: "text-amber-700" },
            };
            const style = statusColors[item.status] || statusColors.draft;

            return (
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="w-full h-[80px] bg-card border border-border rounded-xl flex-row overflow-hidden mb-3"
                onPress={() => router.push(`/(vendor)/(products)/${item.id}`)}
              >
                <View className="w-[80px] h-[80px] bg-muted relative">
                  {item.images?.[0]?.url ? (
                    <Image
                      source={{ uri: item.images[0].url }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Icon name="image" size={24} color={tokens.textDisabled} />
                    </View>
                  )}
                </View>
                <View className="flex-1 py-2 px-3 justify-between">
                  <View className="flex-row justify-between items-start gap-2">
                    <Text
                      className="text-[14px] font-bold text-foreground flex-1"
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <View className={`px-2 py-0.5 rounded-full ${style.bg}`}>
                      <Text className={`text-[10px] font-bold uppercase ${style.text}`}>
                        {item.status.replace("_", " ")}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-[12px] text-muted-foreground font-body" numberOfLines={1}>
                    {subtitle}
                  </Text>
                  <Text className="text-[14px] font-black text-foreground font-heading">
                    GHS {Number(item.price).toFixed(2)}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* Add Action Sheet Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setAddModalVisible(false)} />
          <View className="bg-card rounded-t-3xl p-6 pb-12">
            <View className="w-12 h-1.5 bg-secondary rounded-full self-center mb-6" />
            <Text className="text-display-sm font-heading font-bold text-foreground mb-6">
              Create New Listing
            </Text>

            <View className="gap-3">
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="flex-row items-center p-4 bg-background border border-border rounded-2xl"
                onPress={() => {
                  setAddModalVisible(false);
                  router.push("/(vendor)/(products)/add-product");
                }}
              >
                <View className="w-12 h-12 bg-card rounded-full items-center justify-center border border-border">
                  <Icon name="package" size={24} color={tokens.textPrimary} />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-body-lg font-bold text-foreground mb-0.5">
                    Physical Product
                  </Text>
                  <Text className="text-sm font-body text-muted-foreground">
                    Items that require shipping or delivery
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color={tokens.textMuted} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="flex-row items-center p-4 bg-background border border-border rounded-2xl"
                onPress={() => {
                  setAddModalVisible(false);
                  router.push("/(vendor)/(products)/add-food");
                }}
              >
                <View className="w-12 h-12 bg-card rounded-full items-center justify-center border border-border">
                  <Icon name="coffee" size={24} color={tokens.textPrimary} />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-body-lg font-bold text-foreground mb-0.5">Food Item</Text>
                  <Text className="text-sm font-body text-muted-foreground">
                    Restaurant meals, snacks, or beverages
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color={tokens.textMuted} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className="flex-row items-center p-4 bg-background border border-border rounded-2xl"
                onPress={() => {
                  setAddModalVisible(false);
                  router.push("/(vendor)/(products)/add-service");
                }}
              >
                <View className="w-12 h-12 bg-card rounded-full items-center justify-center border border-border">
                  <Icon name="briefcase" size={24} color={tokens.textPrimary} />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-body-lg font-bold text-foreground mb-0.5">Service</Text>
                  <Text className="text-sm font-body text-muted-foreground">
                    Bookable appointments or freelance work
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color={tokens.textMuted} />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
