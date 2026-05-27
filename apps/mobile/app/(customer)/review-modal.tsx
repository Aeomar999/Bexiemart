import { BackButton } from "@/components/ui/BackButton";
import { View, Text, TextInput, ScrollView, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useState } from "react";
import Toast from "@/lib/toast-polyfill";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Image } from "expo-image";
import { useCreateReview } from "@/lib/hooks/use-reviews";

export default function ReviewModalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const createReview = useCreateReview();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  const MOCK_PHOTOS = [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200&auto=format&fit=crop"
  ];

  const handleAddPhoto = () => {
    if (photos.length < 4) {
      setPhotos([...photos, MOCK_PHOTOS[photos.length % MOCK_PHOTOS.length]]);
      Toast.show({ type: "info", text1: "Photo Added", text2: "Simulated photo upload from camera roll." });
    } else {
      Toast.show({ type: "error", text1: "Maximum Photos", text2: "You can only upload up to 4 photos." });
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!productId) {
      Toast.show({ type: "error", text1: "Missing Product", text2: "Cannot submit review without a product." });
      return;
    }
    createReview.mutate(
      { productId, rating, comment: comment || undefined },
      {
        onSuccess: () => {
          Toast.show({ type: "success", text1: "Review Submitted!", text2: "Thank you for your feedback." });
          router.back();
        },
        onError: () => {
          Toast.show({ type: "error", text1: "Submission Failed", text2: "Please try again." });
        },
      }
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View 
        className="px-5 pb-4 bg-card border-b border-border"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <BackButton />
            <Text className="text-[20px] font-heading font-black text-foreground">
              Write a Review
            </Text>
          </View>
          {createReview.isPending && <ActivityIndicator color="#004CFF" />}
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Rating Stars */}
        <View className="bg-card p-6 rounded-[24px] border border-border items-center shadow-[0_10px_20px_rgba(0,0,0,0.03)] mb-6">
          <Text className="text-[16px] font-bold text-foreground font-heading mb-4">
            How would you rate this product?
          </Text>
          <View className="flex-row gap-3">
            {[1, 2, 3, 4, 5].map((star) => {
              const isSelected = star <= rating;
              return (
                <Pressable 
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] }]} 
                  key={star} 
                  onPress={() => setRating(star)}
                  disabled={createReview.isPending}
                >
                  <Icon 
                    name="star" 
                    size={40} 
                    color={isSelected ? "#f59e0b" : "#e2e8f0"} 
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Photo Upload */}
        <View className="flex-row justify-between items-end mb-3 px-1">
          <Text className="text-[16px] font-bold text-foreground font-heading">Add Photos (Optional)</Text>
          <Text className="text-[12px] font-body text-muted-foreground">{photos.length}/4</Text>
        </View>
        
        {photos.length > 0 && (
          <FlatList
            data={photos}
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            contentContainerStyle={{ gap: 12 }}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View className="w-24 h-24 rounded-[16px] overflow-hidden relative border border-border">
                <Image source={{ uri: item }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                <Pressable 
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full items-center justify-center backdrop-blur-md"
                  onPress={() => handleRemovePhoto(index)}
                  disabled={createReview.isPending}
                >
                  <Icon name="x" size={14} color="#ffffff" />
                </Pressable>
              </View>
            )}
            ListFooterComponent={
              photos.length < 4 ? (
                <Pressable 
                  className="w-24 h-24 rounded-[16px] bg-card border-2 border-dashed border-border items-center justify-center ml-3"
                  onPress={handleAddPhoto}
                  disabled={createReview.isPending}
                >
                  <Icon name="plus" size={24} color="#94a3b8" />
                </Pressable>
              ) : null
            }
          />
        )}

        {photos.length === 0 && (
          <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]} 
            className="bg-card border-2 border-dashed border-border rounded-[24px] h-32 items-center justify-center mb-6"
            onPress={handleAddPhoto}
            disabled={createReview.isPending}
          >
            <View className="w-12 h-12 rounded-full bg-background items-center justify-center mb-2">
              <Icon name="camera" size={20} color="#64748b" />
            </View>
            <Text className="text-[14px] font-bold text-muted-foreground font-body">Tap to upload photos</Text>
          </Pressable>
        )}

        {/* Text Input */}
        <Text className="text-[16px] font-bold text-foreground font-heading mb-3 px-1 mt-2">Your Review</Text>
        <View className="bg-card border border-border rounded-[24px] p-4 min-h-[150px] mb-8 shadow-sm">
          <TextInput
            className="text-[15px] font-body text-foreground w-full flex-1"
            placeholder="What did you like or dislike? What did you use this product for?"
            placeholderTextColor="#94a3b8"
            multiline
            textAlignVertical="top"
            value={comment}
            onChangeText={setComment}
            editable={!createReview.isPending}
          />
        </View>

        <Button 
          title={createReview.isPending ? "Submitting..." : "Submit Review"} 
          size="lg" 
          disabled={rating === 0 || createReview.isPending}
          className="w-full rounded-full"
          onPress={handleSubmit}
        />
      </ScrollView>
    </View>
  );
}
