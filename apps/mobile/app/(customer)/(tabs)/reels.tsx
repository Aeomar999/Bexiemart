import { BackButton } from "@/components/ui/BackButton";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Share,
  ActivityIndicator,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useState, useRef, useCallback, useEffect } from "react";
import { usePopupStore } from "@/lib/stores/popup-store";
import {
  useReels,
  useToggleReelLike,
  useIncrementReelView,
  useReelComments,
  useAddReelComment,
} from "@/lib/hooks/use-reels";
import { useVideoPlayer, VideoView } from "expo-video";

const { height, width } = Dimensions.get("window");

// Format numbers (e.g. 12400 -> 12.4K)
const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const ReelItem = ({
  item,
  isActive,
  onToggleLike,
  onOpenComments,
  onShare,
  insetsBottom,
}: {
  item: any;
  isActive: boolean;
  onToggleLike: (id: string) => void;
  onOpenComments: (reel: any) => void;
  onShare: (reel: any) => void;
  insetsBottom: number;
}) => {
  const router = useRouter();
  const showPopup = usePopupStore((s) => s.showPopup);
  const player = useVideoPlayer(item.videoUrl, (p) => {
    p.loop = true;
    p.muted = false;
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  const vendorName = item.user?.name ?? "Vendor";
  const productName = item.product?.name ?? "Product";
  const productPrice = item.product?.price ?? 0;
  const productId = item.product?.id;
  const isLiked = item.liked ?? false;
  const isFollowing = item.isFollowing ?? false;

  return (
    <View
      style={{ width, height: height - (Platform.OS === "android" ? 0 : 0) }}
      className="bg-black relative"
    >
      {item.thumbnailUrl ? (
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={{ width: "100%", height: "100%", position: "absolute" }}
          contentFit="cover"
        />
      ) : null}
      <VideoView
        style={{ width: "100%", height: "100%" }}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />
      <View className="absolute inset-0 bg-black/30" pointerEvents="none" />

      {/* Right Side Actions */}
      <View className="absolute right-4 bottom-32 items-center gap-6 z-20">
        <Pressable className="items-center" onPress={() => onToggleLike(item.id)}>
          <View className="w-12 h-12 rounded-full bg-black/40 items-center justify-center mb-1">
            <Icon name="heart" size={24} color={isLiked ? "#ef4444" : "#fff"} />
          </View>
          <Text className="text-white font-bold text-body-sm shadow-sm">
            {formatNumber(item.likesCount ?? 0)}
          </Text>
        </Pressable>

        <Pressable className="items-center" onPress={() => onOpenComments(item)}>
          <View className="w-12 h-12 rounded-full bg-black/40 items-center justify-center mb-1">
            <Icon name="message-circle" size={24} color="#fff" />
          </View>
          <Text className="text-white font-bold text-body-sm shadow-sm">
            {formatNumber(item.commentsCount ?? 0)}
          </Text>
        </Pressable>

        <Pressable className="items-center" onPress={() => onShare(item)}>
          <View className="w-12 h-12 rounded-full bg-black/40 items-center justify-center mb-1">
            <Icon name="share-2" size={24} color="#fff" />
          </View>
          <Text className="text-white font-bold text-body-sm shadow-sm">
            {formatNumber(item.shares ?? 0)}
          </Text>
        </Pressable>
      </View>

      {/* Bottom Info & Product Card */}
      <View
        className="absolute left-0 right-0 bottom-0 p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 z-10"
        style={{ paddingBottom: Math.max(insetsBottom, 20) }}
      >
        <View className="flex-row items-center gap-3 mb-3">
          <View className="w-10 h-10 rounded-full bg-secondary border-2 border-card items-center justify-center overflow-hidden">
            <Icon name="user" size={20} color="#94a3b8" />
          </View>
          <Text className="text-white font-bold text-body-lg shadow-sm">
            @{vendorName.replace(/\s+/g, "")}
          </Text>
          <Pressable
            className={`border px-3 py-1 rounded-full ${isFollowing ? "border-transparent bg-card/20" : "border-card/40"}`}
            onPress={() =>
              showPopup({
                type: "info",
                title: "Coming Soon",
                message: "Follow feature coming soon!",
              })
            }
          >
            <Text className="text-white font-bold text-caption">
              {isFollowing ? "Following" : "Follow"}
            </Text>
          </Pressable>
        </View>

        <Text className="text-white font-body text-body-md mb-4 shadow-sm w-4/5" numberOfLines={2}>
          {item.caption}
        </Text>

        {/* Linked Product Card */}
        <Pressable
          className="bg-card/10 backdrop-blur-md border border-card/20 rounded-2xl p-3 flex-row items-center justify-between"
          onPress={() => productId && router.push(`/(customer)/product/${productId}`)}
        >
          <View className="flex-row items-center gap-3 flex-1">
            <View className="w-12 h-12 bg-card rounded-xl items-center justify-center">
              <Icon name="shopping-bag" size={20} color="#0f172a" />
            </View>
            <View className="flex-1 pr-2">
              <Text className="text-white font-bold text-body-md" numberOfLines={1}>
                {productName}
              </Text>
              <Text className="text-white/80 font-body text-body-sm">
                GHS {Number(productPrice).toFixed(2)}
              </Text>
            </View>
          </View>
          <Pressable
            className="bg-primary px-5 py-2.5 rounded-full"
            onPress={() => {
              showPopup({
                type: "success",
                title: "Added to Cart",
                message: `${productName} added to your cart.`,
              });
            }}
          >
            <Text className="text-white font-bold text-sm">Buy</Text>
          </Pressable>
        </Pressable>
      </View>
    </View>
  );
};

export default function ReelsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: reelsData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useReels();
  const reels = reelsData?.pages?.flatMap((page: any) => page.data) ?? [];
  const toggleLike = useToggleReelLike();
  const incrementView = useIncrementReelView();
  const showPopup = usePopupStore((s) => s.showPopup);

  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [activeReelForComments, setActiveReelForComments] = useState<any | null>(null);
  const [newComment, setNewComment] = useState("");

  const { data: comments = [], isLoading: commentsLoading } = useReelComments(
    activeReelForComments?.id ?? null
  );
  const addComment = useAddReelComment();

  // Track which reel is currently in view
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (
        viewableItems.length > 0 &&
        viewableItems[0].index !== null &&
        viewableItems[0].index !== undefined
      ) {
        const newIndex = viewableItems[0].index;
        setActiveReelIndex(newIndex);
        const item = reels[newIndex];
        if (item?.id) {
          incrementView.mutate(item.id);
        }
      }
    }
  ).current;

  const handleShare = async (reel: any) => {
    try {
      await Share.share({
        message: `Check out this reel from ${reel.user?.name || "vendor"} on Bexiemart!`,
      });
    } catch (error) {
      logger.error(error);
    }
  };

  const handlePostComment = () => {
    const content = newComment.trim();
    if (!content || !activeReelForComments) return;
    addComment.mutate(
      { reelId: activeReelForComments.id, content },
      {
        onSuccess: () => setNewComment(""),
        onError: (e: any) =>
          showPopup({ type: "error", title: "Couldn't post", message: e?.message ?? "Try again." }),
      }
    );
  };

  const handleToggleLike = (reelId: string) => {
    toggleLike.mutate(reelId);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <ReelItem
      item={item}
      isActive={index === activeReelIndex}
      onToggleLike={handleToggleLike}
      onOpenComments={(reel) => {
        setActiveReelForComments(reel);
        setCommentModalVisible(true);
      }}
      onShare={handleShare}
      insetsBottom={insets.bottom}
    />
  );

  return (
    <View className="flex-1 bg-black relative">
      <FlashList
        data={reels}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        estimatedItemSize={height}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={() => {
          if (hasNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4 items-center bg-black">
              <ActivityIndicator color="#fff" />
            </View>
          ) : null
        }
      />

      {/* Header Overlay */}
      <View
        className="absolute top-0 left-0 right-0 px-5 pb-4 flex-row justify-between items-center z-30"
        style={{ paddingTop: Math.max(insets.top, 20) }}
        pointerEvents="box-none"
      >
        <BackButton
          className="w-10 h-10 rounded-full bg-black/40 items-center justify-center backdrop-blur-md"
          color="#fff"
        />
        <Text className="text-heading-md font-heading font-bold text-white shadow-sm">
          Discover
        </Text>
        <View className="w-10 h-10" />
      </View>

      {/* Comments Bottom Sheet Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/50"
        >
          <View
            className="bg-card rounded-t-3xl h-2/3"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            {/* Modal Header */}
            <View className="flex-row justify-between items-center p-5 border-b border-border">
              <Text className="text-body-lg font-bold font-heading text-foreground">
                {activeReelForComments
                  ? `${activeReelForComments.commentsCount ?? comments.length} comments`
                  : "0 comments"}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close comments"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => setCommentModalVisible(false)}
                className="w-8 h-8 rounded-full bg-muted items-center justify-center"
              >
                <Icon name="x" size={16} color="#64748b" />
              </Pressable>
            </View>

            {/* Comments List */}
            <FlashList
              data={comments}
              keyExtractor={(item: any) => item.id}
              className="flex-1 px-5 pt-4"
              estimatedItemSize={60}
              ListEmptyComponent={
                commentsLoading ? (
                  <View className="items-center justify-center py-10">
                    <ActivityIndicator color="#64748b" />
                  </View>
                ) : (
                  <View className="items-center justify-center py-10">
                    <Text className="text-muted-foreground text-body-md">
                      No comments yet. Be the first!
                    </Text>
                  </View>
                )
              }
              renderItem={({ item }: { item: any }) => (
                <View className="flex-row gap-3 mb-6">
                  <View className="w-8 h-8 rounded-full bg-secondary items-center justify-center overflow-hidden">
                    {item.user?.image ? (
                      <Image source={{ uri: item.user.image }} style={{ width: 32, height: 32 }} />
                    ) : (
                      <Text className="text-muted-foreground font-bold text-body-sm">
                        {(item.user?.name || "U").charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-body-sm text-muted-foreground font-bold mb-1">
                      {item.user?.name || "Customer"}
                    </Text>
                    <Text className="text-body-md text-foreground font-body leading-tight">
                      {item.content}
                    </Text>
                  </View>
                </View>
              )}
            />

            {/* Comment Input */}
            <View className="px-5 pt-3 border-t border-border flex-row items-center gap-3">
              <TextInput
                className="flex-1 bg-muted rounded-full h-12 px-5 font-body text-body-md text-foreground"
                placeholder="Add comment..."
                value={newComment}
                onChangeText={setNewComment}
                onSubmitEditing={handlePostComment}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send comment"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className={`w-10 h-10 rounded-full items-center justify-center ${newComment.trim() ? "bg-primary" : "bg-secondary"}`}
                onPress={handlePostComment}
              >
                <Icon name="send" size={16} color={newComment.trim() ? "#fff" : "#94a3b8"} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
