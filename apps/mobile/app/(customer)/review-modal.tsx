import { tokens } from "@/theme/tokens";
import { BackButton } from "@/components/ui/BackButton";
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useState } from "react";
import Toast from "@/lib/toast-polyfill";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useCreateReview } from "@/lib/hooks/use-reviews";

export default function ReviewModalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const createReview = useCreateReview();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (!productId) {
      Toast.show({
        type: "error",
        text1: "Missing Product",
        text2: "Cannot submit review without a product.",
      });
      return;
    }
    createReview.mutate(
      { productId, rating, comment: comment || undefined },
      {
        onSuccess: () => {
          Toast.show({
            type: "success",
            text1: "Review Submitted!",
            text2: "Thank you for your feedback.",
          });
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
            <Text className="text-display-sm font-heading font-black text-foreground">
              Write a Review
            </Text>
          </View>
          {createReview.isPending && <ActivityIndicator color={tokens.primary} />}
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Rating Stars */}
        <View className="bg-card p-6 rounded-2xl border border-border items-center shadow-lg mb-6">
          <Text className="text-body-lg font-bold text-foreground font-heading mb-4">
            How would you rate this product?
          </Text>
          <View className="flex-row gap-3">
            {[1, 2, 3, 4, 5].map((star) => {
              const isSelected = star <= rating;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Rate ${star} star${star === 1 ? "" : "s"}`}
                  style={({ pressed }) => [
                    { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] },
                  ]}
                  key={star}
                  onPress={() => setRating(star)}
                  disabled={createReview.isPending}
                >
                  <Icon name="star" size={40} color={isSelected ? "#f59e0b" : "#e2e8f0"} />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Text Input */}
        <Text className="text-body-lg font-bold text-foreground font-heading mb-3 px-1 mt-2">
          Your Review
        </Text>
        <View className="bg-card border border-border rounded-2xl p-4 min-h-[150px] mb-8 shadow-sm">
          <TextInput
            className="text-body-lg font-body text-foreground w-full flex-1"
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
