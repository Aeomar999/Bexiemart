import React, { useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, Modal, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "@/components/ui/BackButton";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { tokens } from "@/theme/tokens";
import { useSupportTickets, useRateSupportTicket } from "@/lib/hooks/use-support";
import Toast from "@/lib/toast-polyfill";
import { formatDistanceToNow } from "date-fns";

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  OPEN: { bg: "#e0f2fe", text: "#0284c7", label: "Open" },
  ASSIGNED: { bg: "#fef3c7", text: "#d97706", label: "Assigned" },
  IN_PROGRESS: { bg: "#e0e7ff", text: "#4f46e5", label: "In Progress" },
  RESOLVED: { bg: "#d1fae5", text: "#059669", label: "Resolved" },
  CLOSED: { bg: "#f1f5f9", text: "#64748b", label: "Closed" },
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  LOW: { bg: "#f1f5f9", text: "#64748b" },
  NORMAL: { bg: "#e0f2fe", text: "#0284c7" },
  HIGH: { bg: "#ffedd5", text: "#ea580c" },
  URGENT: { bg: "#fee2e2", text: "#dc2626" },
};

export default function SupportTicketsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch, isRefetching } = useSupportTickets(page);
  const rateMutation = useRateSupportTicket();

  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");

  const tickets = data?.data || [];

  const handleOpenRating = (ticketId: string, e: any) => {
    e.stopPropagation();
    setSelectedTicketId(ticketId);
    setRating(5);
    setComment("");
    setRatingModalVisible(true);
  };

  const handleSubmitRating = () => {
    if (!selectedTicketId) return;
    rateMutation.mutate(
      { ticketId: selectedTicketId, data: { rating, comment: comment.trim() || undefined } },
      {
        onSuccess: () => {
          Toast.show({ type: "success", text1: "Thank you for your feedback!" });
          setRatingModalVisible(false);
        },
        onError: (err: any) => {
          Toast.show({ type: "error", text1: "Rating failed", text2: err.message });
        },
      }
    );
  };

  const renderTicketItem = ({ item }: { item: any }) => {
    const status = statusColors[item.status] || {
      bg: "#f1f5f9",
      text: "#64748b",
      label: item.status,
    };
    const priority = priorityColors[item.priority] || priorityColors.NORMAL;
    const lastMessage = item.conversation?.messages?.[0];
    const canRate = (item.status === "RESOLVED" || item.status === "CLOSED") && !item.rating;

    return (
      <Pressable
        onPress={() => router.push(`/(customer)/chats/${item.conversationId}`)}
        className="bg-card p-5 rounded-2xl border border-border mb-3 active:bg-secondary/40"
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: status.bg }}>
              <Text className="text-caption font-bold" style={{ color: status.text }}>
                {status.label}
              </Text>
            </View>
            {item.priority === "URGENT" && (
              <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: priority.bg }}>
                <Text className="text-caption font-bold uppercase" style={{ color: priority.text }}>
                  Urgent
                </Text>
              </View>
            )}
          </View>
          <Text className="text-caption text-muted-foreground font-body">
            {formatDistanceToNow(new Date(item.updatedAt || item.createdAt), { addSuffix: true })}
          </Text>
        </View>

        <Text
          className="text-heading-sm font-bold text-foreground font-heading mb-1"
          numberOfLines={1}
        >
          {item.subject}
        </Text>

        <Text className="text-body-sm text-muted-foreground font-body mb-3" numberOfLines={2}>
          {lastMessage
            ? lastMessage.type === "IMAGE"
              ? "📷 [Image attachment]"
              : lastMessage.content
            : "No messages yet"}
        </Text>

        <View className="flex-row items-center justify-between pt-3 border-t border-border">
          <Text className="text-caption font-bold text-muted-foreground uppercase">
            {item.category.replace("_", " ")}
          </Text>

          {item.rating ? (
            <View className="flex-row items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <Icon name="star" size={14} color="#f59e0b" />
              <Text className="text-caption font-bold text-amber-700">{item.rating}/5 Rated</Text>
            </View>
          ) : canRate ? (
            <Pressable
              onPress={(e) => handleOpenRating(item.id, e)}
              className="bg-primary-subtle px-3 py-1 rounded-lg border border-primary/20 flex-row items-center gap-1.5"
            >
              <Icon name="star" size={14} color={tokens.primary} />
              <Text className="text-caption font-bold text-primary">Rate Support</Text>
            </Pressable>
          ) : (
            <View className="flex-row items-center gap-1">
              <Text className="text-caption font-bold text-primary">View Chat</Text>
              <Icon name="chevron-right" size={14} color={tokens.primary} />
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-5 pt-4 pb-4 bg-card border-b border-border flex-row items-center justify-between"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center gap-3">
          <BackButton />
          <Text className="text-display-sm font-heading font-black text-foreground">
            Support Tickets
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/(customer)/support/create-ticket")}
          className="bg-primary px-3.5 py-2 rounded-xl flex-row items-center gap-1.5"
        >
          <Icon name="plus" size={16} color="#ffffff" />
          <Text className="text-caption font-bold text-white">New Ticket</Text>
        </Pressable>
      </View>

      {isLoading && !isRefetching ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={tokens.primary} />
          <Text className="text-muted-foreground text-body-sm mt-2">
            Loading support tickets...
          </Text>
        </View>
      ) : isError ? (
        <ErrorState message="Failed to load your support tickets." onRetry={refetch} />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={renderTicketItem}
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20 }}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState
              title="No support tickets"
              description="You haven't opened any support requests yet. If you have any issues with your orders or account, we are here to help."
              actionLabel="Contact Support"
              onAction={() => router.push("/(customer)/support/create-ticket")}
            />
          }
        />
      )}

      {/* Rating Modal */}
      <Modal visible={ratingModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-card w-full rounded-3xl p-6 border border-border">
            <Text className="text-heading-md font-bold text-foreground font-heading text-center">
              Rate Support Experience
            </Text>
            <Text className="text-body-sm text-muted-foreground font-body text-center mt-1 mb-6">
              How satisfied are you with the resolution of your ticket?
            </Text>

            {/* Star Selector */}
            <View className="flex-row justify-center gap-3 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Rate ${star} star${star === 1 ? "" : "s"}`}
                  key={star}
                  onPress={() => setRating(star)}
                  className="p-2"
                >
                  <Icon name="star" size={36} color={star <= rating ? "#f59e0b" : "#e2e8f0"} />
                </Pressable>
              ))}
            </View>

            <Text className="text-body-sm font-bold text-foreground mb-2">Comment (Optional)</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Tell us what went well or how we can improve..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-secondary p-3.5 rounded-xl border border-border text-foreground font-body text-body-md min-h-[90px] mb-6"
            />

            <View className="flex-row gap-3">
              <Button
                variant="outline"
                label="Cancel"
                onPress={() => setRatingModalVisible(false)}
                className="flex-1"
              />
              <Button
                variant="primary"
                label="Submit"
                onPress={handleSubmitRating}
                className="flex-1"
                isLoading={rateMutation.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
