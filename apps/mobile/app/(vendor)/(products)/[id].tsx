import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Alert, Pressable } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVendorProducts, useDeleteProduct } from "@/lib/hooks/use-vendor";
import { useFoodItems } from "@/lib/hooks/use-food";
import { useVendorServices } from "@/lib/hooks/use-vendor-services";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { DetailSkeleton } from "@/components/ui/Skeleton";

export default function ListingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: products = [], isLoading: productsLoading } = useVendorProducts();
  const { data: foodItems = [], isLoading: foodLoading } = useFoodItems({});
  const { data: services = [], isLoading: servicesLoading } = useVendorServices();
  const deleteMutation = useDeleteProduct();

  const getItemData = () => {
    if (id?.startsWith?.("PROD")) {
      const p = products.find((x: any) => x.id === id);
      if (!p) return null;
      return {
        type: "Product",
        name: p.name,
        price: p.price,
        status: p.status,
        category: p.category,
        details: [
          { label: "Stock", value: String(p.stock ?? "-") },
          { label: "SKU", value: p.sku ?? "-" },
          { label: "Shipping", value: p.shippingRequired ? "Required" : "Not Required" },
        ],
        description: p.description ?? "",
        images: p.images ?? [],
      };
    }
    if (id?.startsWith?.("FOOD")) {
      const f = foodItems.find((x: any) => x.id === id);
      if (!f) return null;
      return {
        type: "Food",
        name: f.name,
        price: f.price,
        status: f.status,
        category: f.category,
        details: [
          { label: "Prep Time", value: f.prepTime ?? "-" },
          { label: "Dietary", value: f.dietaryTags?.join?.(", ") ?? "-" },
        ],
        description: f.description ?? "",
        images: f.imageUrl ? [{ url: f.imageUrl }] : [],
      };
    }
    if (id?.startsWith?.("SERV")) {
      const s = services.find((x: any) => x.id === id);
      if (!s) return null;
      return {
        type: "Service",
        name: s.name,
        price: s.price,
        status: s.status,
        category: s.category,
        details: [
          { label: "Duration", value: s.duration ?? "-" },
          { label: "Pricing Model", value: s.pricingModel ?? "Fixed" },
          { label: "Location", value: s.locationType === "remote" ? "Remote" : "In-Person" },
        ],
        description: s.description ?? "",
        images: s.imageUrl ? [{ url: s.imageUrl }] : [],
      };
    }
    return null;
  };

  const item = getItemData();
  const isLoading = id?.startsWith?.("PROD")
    ? productsLoading
    : id?.startsWith?.("FOOD")
      ? foodLoading
      : servicesLoading;

  const handleDelete = () => {
    Alert.alert(
      "Delete Listing",
      `Are you sure you want to delete "${item?.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (id?.startsWith?.("PROD") && deleteMutation) {
              deleteMutation.mutate(id, {
                onSuccess: () => {
                  Alert.alert("Deleted", "Product has been removed.");
                  router.back();
                },
                onError: () => Alert.alert("Error", "Failed to delete product."),
              });
            } else {
              Alert.alert("Deleted", "Listing has been removed.");
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    let route = "";
    if (item?.type === "Product") route = "/(vendor)/(products)/add-product";
    if (item?.type === "Food") route = "/(vendor)/(products)/add-food";
    if (item?.type === "Service") route = "/(vendor)/(products)/add-service";

    if (route) {
      router.push({ pathname: route as any, params: { mode: "edit", id } });
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <DetailSkeleton />
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-[16px] text-muted-foreground">Listing not found.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Custom Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center justify-between"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row items-center">
          <BackButton className="mr-3" />
          <Text className="text-[20px] font-heading font-black text-foreground">
            {item.type} Details
          </Text>
        </View>
        <View
          className={`px-3 py-1 rounded-full ${item.status === "active" || item.status === "available" ? "bg-green-100" : "bg-accent"}`}
        >
          <Text
            className={`text-[12px] font-bold ${item.status === "active" || item.status === "available" ? "text-green-700" : "text-muted-foreground"}`}
          >
            {item.status.toUpperCase().replace("_", " ")}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="pb-12 pt-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Product Images */}
        {item.images && item.images.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
            contentContainerStyle={{ gap: 12 }}
          >
            {item.images.map((img: any, idx: number) => (
              <View
                key={idx}
                className="w-64 h-64 bg-accent rounded-[24px] overflow-hidden border border-border"
              >
                <Image
                  source={{ uri: img.url }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </View>
            ))}
          </ScrollView>
        ) : (
          <View className="w-full h-64 bg-accent rounded-[24px] items-center justify-center mb-6 border border-border">
            <Icon name="image" size={48} color="#94a3b8" />
            <Text className="text-[14px] text-muted-foreground mt-4">No images available</Text>
          </View>
        )}

        {/* Basic Info */}
        <View className="mb-8">
          <Text className="text-[28px] font-heading font-bold text-foreground mb-2">
            {item.name}
          </Text>
          <Text className="text-[24px] font-bold text-brand-600 mb-4">
            GHS {item.price.toFixed(2)}
          </Text>
          <Text className="text-[15px] font-body text-muted-foreground leading-relaxed">
            {item.description}
          </Text>
        </View>

        <View className="h-px bg-accent my-2 mb-6" />

        {/* Specifications */}
        <View className="mb-8">
          <Text className="text-[18px] font-heading font-bold text-foreground mb-4">
            Specifications
          </Text>
          <View className="bg-card rounded-[20px] border border-border overflow-hidden">
            <View className="flex-row items-center justify-between p-4 border-b border-border">
              <Text className="text-[14px] text-muted-foreground font-body">Category</Text>
              <Text className="text-[14px] font-bold text-foreground">{item.category}</Text>
            </View>
            {item.details.map((detail: any, index: number) => (
              <View
                key={detail.label}
                className={`flex-row items-center justify-between p-4 ${index < item.details.length - 1 ? "border-b border-border" : ""}`}
              >
                <Text className="text-[14px] text-muted-foreground font-body">{detail.label}</Text>
                <Text className="text-[14px] font-bold text-foreground">{detail.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View className="gap-3 mt-4">
          <Button title="Edit Listing" size="lg" onPress={handleEdit} className="w-full" />
          <Pressable
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            onPress={handleDelete}
            className="w-full py-4 items-center rounded-full bg-rose-50 border border-rose-100"
          >
            <Text className="text-[15px] font-bold text-rose-600">Delete Listing</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
