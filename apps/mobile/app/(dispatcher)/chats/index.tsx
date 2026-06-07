import { View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui";
import { Avatar } from "@/components/ui/Avatar";
import { useConversations } from "@/lib/hooks/use-chat";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useSocketStore } from "@/lib/stores/socket-store";
import { formatDistanceToNow } from "date-fns";
import { BackButton } from "@/components/ui/BackButton";
import { ListSkeleton } from "@/components/ui/Skeleton";

export default function ChatListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { data: conversations, isLoading, refetch } = useConversations();
  const onlineUsers = useSocketStore((s) => s.onlineUsers);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ListSkeleton />
      </View>
    );
  }

  const renderConversation = ({ item }: { item: any }) => {
    const otherParticipant = item.participants.find((p: any) => p.id !== user?.id);
    if (!otherParticipant) return null;

    const isOnline = onlineUsers[otherParticipant.id] === true;

    return (
      <Pressable
        className="flex-row items-center p-4 border-b border-border active:bg-accent/50"
        onPress={() => router.push(`/(dispatcher)/chats/${item.id}`)}
      >
        <View className="relative">
          <Avatar
            uri={otherParticipant.image}
            name={otherParticipant.name}
            size={50}
            fallback="initials"
          />
          {isOnline && (
            <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
          )}
        </View>

        <View className="flex-1 ml-4">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="font-bold text-foreground text-[16px]" numberOfLines={1}>
              {otherParticipant.name}
            </Text>
            {item.lastMessage && (
              <Text className="text-muted-foreground text-[12px]">
                {formatDistanceToNow(new Date(item.lastMessage.createdAt), { addSuffix: true })}
              </Text>
            )}
          </View>

          <View className="flex-row justify-between items-center">
            <Text
              className={`text-[14px] flex-1 mr-4 ${
                item.unreadCount > 0 ? "font-bold text-foreground" : "text-muted-foreground"
              }`}
              numberOfLines={1}
            >
              {item.lastMessage?.type === "IMAGE"
                ? "📷 Image"
                : item.lastMessage?.content || "No messages yet"}
            </Text>

            {item.unreadCount > 0 && (
              <View className="bg-brand-600 w-5 h-5 rounded-full items-center justify-center">
                <Text className="text-white text-[10px] font-bold">
                  {item.unreadCount > 9 ? "9+" : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-[20px] font-heading font-black text-foreground">Chats</Text>
        </View>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20 px-5">
            <Icon name="message-square" size={64} color="#cbd5e1" />
            <Text className="text-foreground font-heading font-bold text-[18px] mt-4 text-center">
              No messages yet
            </Text>
            <Text className="text-muted-foreground font-body text-[14px] mt-2 text-center">
              Your conversations with vendors and riders will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}
