import { BackButton } from "@/components/ui/BackButton";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useProductStore } from "@/lib/stores/product-store";
import { usePopupStore } from "@/lib/stores/popup-store";
import { useCreateReel } from "@/lib/hooks/use-vendor-reels";

export default function AddReelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const createReel = useCreateReel();
  const products = useProductStore((s) => s.products);
  const showPopup = usePopupStore((s) => s.showPopup);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const [isUploadModalVisible, setUploadModalVisible] = useState(false);
  const [isProductModalVisible, setProductModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Since we simulate video, we'll pick a random high-res image
  const handleUploadOption = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadModalVisible(false);
      // Dummy high-res vertical image to simulate video thumbnail/content
      setVideoUrl(
        "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?q=80&w=1000&auto=format&fit=crop"
      );
    }, 1500);
  };

  const handlePublish = () => {
    if (!videoUrl) {
      showPopup({
        type: "error",
        title: "Missing Video",
        message: "Please upload a video to continue.",
      });
      return;
    }
    if (!selectedProductId) {
      showPopup({
        type: "error",
        title: "Product Required",
        message: "Tag a product to make this reel shoppable.",
      });
      return;
    }

    const linkedProduct = products.find((p) => p.id === selectedProductId);
    if (!linkedProduct) return;

    setIsPublishing(true);

    const payload = {
      videoUrl,
      description: description || "Check out this amazing product! 🛍️✨",
      productId: linkedProduct.id,
      productName: linkedProduct.name,
      productPrice: linkedProduct.price,
    };

    createReel.mutate(payload, {
      onSuccess: () => {
        setIsPublishing(false);
        showPopup({
          type: "success",
          title: "Reel Published!",
          message: "Your reel is now live for all customers to watch.",
        });
        router.back();
      },
      onError: () => {
        setIsPublishing(false);
      },
    });
  };

  const linkedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      {/* Header */}
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-display-sm font-heading font-black text-foreground">New Reel</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-32 pt-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Video Upload Section */}
        <View className="mb-8 mt-2">
          <Pressable
            style={({ pressed }) => [
              { opacity: pressed ? 0.95 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
            onPress={() => setUploadModalVisible(true)}
            className="w-full bg-background rounded-3xl overflow-hidden items-center justify-center relative shadow-lg shadow-black/10"
            style={{ aspectRatio: 9 / 16 }}
          >
            {videoUrl ? (
              <>
                <Image
                  source={{ uri: videoUrl }}
                  style={{ width: "100%", height: "100%", opacity: 0.9 }}
                  contentFit="cover"
                />
                <View className="absolute inset-0 items-center justify-center bg-black/20">
                  <View className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl items-center justify-center border border-white/30">
                    <Icon name="play" size={24} color="#fff" style={{ marginLeft: 4 }} />
                  </View>
                </View>
                <View className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full flex-row items-center border border-white/10">
                  <Icon name="camera" size={14} color="#fff" style={{ marginRight: 6 }} />
                  <Text className="text-white font-bold text-body-sm">Replace</Text>
                </View>
              </>
            ) : (
              <View className="items-center justify-center p-6 w-full h-full border-[3px] border-dashed border-border rounded-3xl m-1">
                <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-5">
                  <Icon name="video" size={32} color="#38bdf8" />
                </View>
                <Text className="text-display-sm font-heading font-black text-white mb-2 tracking-tight">
                  Upload Video
                </Text>
                <Text className="text-body-md text-muted-foreground text-center font-body px-8">
                  High quality vertical videos (9:16) perform best.
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Details Section */}
        <View className="bg-white rounded-2xl border border-border p-1 mb-6 shadow-sm shadow-sm/50">
          <TextInput
            className="p-5 font-body text-body-lg text-foreground min-h-[120px]"
            placeholder="Write a catchy caption... #trending #fashion"
            placeholderTextColor="#94a3b8"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Link Product Section */}
        <Text className="text-body-md font-bold text-muted-foreground mb-3 ml-2 uppercase tracking-wider">
          Shoppable Link
        </Text>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          className={`flex-row items-center p-4 rounded-2xl border ${linkedProduct ? "bg-primary-subtle border-border" : "bg-white border-border border-dashed"}`}
          onPress={() => setProductModalVisible(true)}
        >
          {linkedProduct ? (
            <>
              <View className="w-14 h-14 bg-white rounded-xl items-center justify-center border border-border shadow-sm shadow-none">
                <Icon name="shopping-bag" size={24} color="var(--color-primary)" />
              </View>
              <View className="ml-4 flex-1">
                <Text
                  className="text-body-lg font-bold text-foreground mb-1 tracking-tight"
                  numberOfLines={1}
                >
                  {linkedProduct.name}
                </Text>
                <Text className="text-body-md text-primary font-bold">
                  GHS {linkedProduct.price.toFixed(2)}
                </Text>
              </View>
              <View className="w-8 h-8 bg-primary-subtle rounded-full items-center justify-center">
                <Icon name="edit-2" size={14} color="var(--color-primary)" />
              </View>
            </>
          ) : (
            <>
              <View className="w-14 h-14 bg-muted rounded-xl items-center justify-center">
                <Icon name="tag" size={24} color="#64748b" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-body-lg font-bold text-foreground mb-0.5 tracking-tight">
                  Tag a Product
                </Text>
                <Text className="text-sm text-muted-foreground font-body">
                  Allow customers to buy while watching
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#94a3b8" />
            </>
          )}
        </Pressable>
      </ScrollView>

      {/* Floating Sticky Publish Button */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-border px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        <Button
          title={videoUrl ? "Publish Reel" : "Select Video to Publish"}
          size="lg"
          loading={isPublishing}
          disabled={!videoUrl || isPublishing}
          onPress={handlePublish}
          className="w-full shadow-lg shadow-none"
        />
      </View>

      {/* Upload Action Sheet */}
      <Modal
        visible={isUploadModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => !isUploading && setUploadModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <Pressable
            className="absolute inset-0"
            onPress={() => !isUploading && setUploadModalVisible(false)}
          />
          <View
            className="bg-white rounded-t-3xl p-6"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="w-12 h-1.5 bg-muted rounded-full self-center mb-8" />

            {isUploading ? (
              <View className="py-10 items-center justify-center">
                <ListSkeleton />
                <Text className="mt-6 text-heading-md font-heading font-bold text-foreground tracking-tight">
                  Processing video...
                </Text>
                <Text className="mt-2 text-body-md text-muted-foreground text-center px-10">
                  Optimizing for the best playback experience on mobile devices.
                </Text>
              </View>
            ) : (
              <>
                <Text className="text-display-md font-heading font-black text-foreground mb-6 tracking-tight">
                  Select Source
                </Text>
                <View className="gap-4">
                  <Pressable
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    className="flex-row items-center p-5 bg-background border border-border rounded-2xl"
                    onPress={handleUploadOption}
                  >
                    <View className="w-14 h-14 bg-white rounded-full items-center justify-center shadow-sm shadow-sm">
                      <Icon name="camera" size={24} color="#0f172a" />
                    </View>
                    <View className="ml-4 flex-1">
                      <Text className="text-body-lg font-bold text-foreground mb-1 tracking-tight">
                        Record Video
                      </Text>
                      <Text className="text-sm font-body text-muted-foreground">
                        Use camera to capture content
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#cbd5e1" />
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    className="flex-row items-center p-5 bg-primary-subtle border border-border rounded-2xl"
                    onPress={handleUploadOption}
                  >
                    <View className="w-14 h-14 bg-primary rounded-full items-center justify-center shadow-md shadow-none">
                      <Icon name="image" size={24} color="#fff" />
                    </View>
                    <View className="ml-4 flex-1">
                      <Text className="text-body-lg font-bold text-foreground mb-1 tracking-tight">
                        Choose from Gallery
                      </Text>
                      <Text className="text-sm font-body text-primary-hover">
                        Select an existing video
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="var(--color-primary)" />
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Product Selection Modal */}
      <Modal
        visible={isProductModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setProductModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/60"
        >
          <View
            className="bg-white rounded-t-3xl h-[80%]"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="p-6 pb-4 border-b border-border flex-row items-center justify-between">
              <Text className="text-display-sm font-heading font-black text-foreground tracking-tight">
                Tag Product
              </Text>
              <Pressable
                onPress={() => setProductModalVisible(false)}
                className="w-10 h-10 rounded-full bg-muted items-center justify-center"
              >
                <Icon name="x" size={20} color="#0f172a" />
              </Pressable>
            </View>

            <View className="p-5 border-b border-border">
              <View className="flex-row items-center bg-muted rounded-full px-4 h-12">
                <Icon name="search" size={20} color="#64748b" />
                <TextInput
                  placeholder="Search your products..."
                  className="flex-1 ml-3 font-body text-body-lg text-foreground"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
              {products.map((product) => (
                <Pressable
                  key={product.id}
                  onPress={() => {
                    setSelectedProductId(product.id);
                    setProductModalVisible(false);
                  }}
                  className={`flex-row items-center p-4 mb-3 rounded-2xl border ${selectedProductId === product.id ? "bg-primary-subtle border-border" : "bg-background border-border"}`}
                >
                  <View className="w-16 h-16 bg-muted rounded-lg items-center justify-center">
                    <Icon name="package" size={24} color="#94a3b8" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text
                      className="text-body-lg font-bold text-foreground mb-1 tracking-tight"
                      numberOfLines={1}
                    >
                      {product.name}
                    </Text>
                    <Text className="text-sm text-muted-foreground font-body mb-1">
                      {product.category}
                    </Text>
                    <Text className="text-body-md text-primary font-bold">
                      GHS {product.price.toFixed(2)}
                    </Text>
                  </View>
                  <View
                    className={`w-6 h-6 rounded-full items-center justify-center border-2 ${selectedProductId === product.id ? "bg-primary border-primary" : "bg-transparent border-border"}`}
                  >
                    {selectedProductId === product.id && (
                      <Icon name="check" size={12} color="#fff" />
                    )}
                  </View>
                </Pressable>
              ))}
              <View className="h-10" />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}
