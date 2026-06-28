import { BackButton } from "@/components/ui/BackButton";
import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { useVendorReviews, useReplyToReview } from "@/lib/hooks/use-vendor-reviews";
import { DetailSkeleton } from "@/components/ui/Skeleton";

export default function VendorReviewsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: reviews, isLoading } = useVendorReviews();
  const replyToReview = useReplyToReview();

  const [replyModalId, setReplyModalId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const handleReply = () => {
    if (!replyModalId || !replyText.trim()) {
      Alert.alert("Required", "Please enter a reply.");
      return;
    }
    replyToReview.mutate(
      { id: replyModalId, reply: replyText },
      {
        onSuccess: () => {
          setReplyModalId(null);
          setReplyText("");
        },
      }
    );
  };

  const ratingDistribution = [5, 4, 3, 2, 1].map((r) => {
    const count = (reviews ?? []).filter((rev: any) => Math.floor(rev.rating) === r).length;
    const total = (reviews ?? []).length || 1;
    return { rating: r, percentage: (count / total) * 100 };
  });

  const avgRating = (reviews ?? []).length
    ? (
        (reviews ?? []).reduce((sum: number, rev: any) => sum + rev.rating, 0) /
        (reviews ?? []).length
      ).toFixed(1)
    : "0.0";

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pb-4 bg-card border-b border-border flex-row items-center"
        style={{ paddingTop: (insets.top || 12) + 12 }}
      >
        <BackButton className="mr-3" />
        <Text className="text-display-sm font-heading font-black text-foreground">
          Customer Reviews
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <DetailSkeleton />
        </View>
      ) : (
        <ScrollView className="flex-1 px-5 pt-6 pb-12">
          {/* Analytics Card */}
          <View className="bg-card rounded-2xl border border-border p-6 mb-6 items-center flex-row">
            <View className="items-center mr-6 border-r border-border pr-6">
              <Text className="text-[48px] font-heading font-black text-foreground">
                {avgRating}
              </Text>
              <View className="flex-row mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon
                    key={star}
                    name="star"
                    size={16}
                    color="#f59e0b"
                    style={{ marginHorizontal: 2 }}
                  />
                ))}
              </View>
              <Text className="text-body-sm text-muted-foreground">
                Based on {(reviews ?? []).length} reviews
              </Text>
            </View>
            <View className="flex-1 gap-2">
              {ratingDistribution.map((item) => (
                <View key={item.rating} className="flex-row items-center">
                  <Text className="text-body-sm font-bold text-muted-foreground w-3">
                    {item.rating}
                  </Text>
                  <View className="flex-1 h-2 bg-muted rounded-full mx-2 overflow-hidden">
                    <View
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Review List */}
          <Text className="text-heading-md font-bold text-foreground mb-4">Recent Reviews</Text>
          <View className="gap-4">
            {(reviews ?? []).map((review: any) => (
              <View key={review.id} className="bg-card rounded-2xl border border-border p-5">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center mr-3">
                      <Text className="text-body-lg font-bold text-muted-foreground">
                        {review.customer?.charAt(0) || "?"}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-body-lg font-bold text-foreground">
                        {review.customer}
                      </Text>
                      <Text className="text-body-sm text-muted-foreground">{review.date}</Text>
                    </View>
                  </View>
                  <View className="flex-row bg-amber-50 px-2 py-1 rounded-full items-center">
                    <Icon name="star" size={12} color="#f59e0b" />
                    <Text className="text-body-sm font-bold text-amber-600 ml-1">
                      {review.rating}.0
                    </Text>
                  </View>
                </View>
                <Text className="text-body-md text-muted-foreground leading-relaxed mb-4">
                  "{review.comment}"
                </Text>

                {review.reply ? (
                  <View className="bg-background p-3 rounded-lg border border-border">
                    <View className="flex-row items-center mb-1">
                      <Icon
                        name="corner-down-right"
                        size={14}
                        color="#64748b"
                        style={{ marginRight: 6 }}
                      />
                      <Text className="text-sm font-bold text-foreground">Your Reply</Text>
                    </View>
                    <Text className="text-sm text-muted-foreground">{review.reply}</Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => {
                      setReplyModalId(review.id);
                      setReplyText("");
                    }}
                    className="flex-row items-center justify-center py-2.5 bg-primary-subtle rounded-lg border border-border"
                  >
                    <Icon
                      name="message-circle"
                      size={16}
                      color="var(--color-primary)"
                      style={{ marginRight: 6 }}
                    />
                    <Text className="text-body-md font-bold text-primary">Reply to Customer</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Reply Modal */}
      <Modal
        visible={!!replyModalId}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReplyModalId(null)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setReplyModalId(null)} />
          <View className="bg-card rounded-t-3xl p-6 pb-12">
            <View className="w-12 h-1.5 bg-secondary rounded-full self-center mb-6" />
            <Text className="text-display-sm font-heading font-bold text-foreground mb-6">
              Reply to Review
            </Text>

            <View className="gap-4">
              <View className="bg-background rounded-xl border border-border p-4">
                <TextInput
                  className="text-body-lg text-foreground min-h-[100px]"
                  placeholder="Write your reply..."
                  placeholderTextColor="#94a3b8"
                  value={replyText}
                  onChangeText={setReplyText}
                  multiline
                  textAlignVertical="top"
                />
              </View>
              <Button
                title="Send Reply"
                size="lg"
                loading={replyToReview.isPending}
                onPress={handleReply}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
