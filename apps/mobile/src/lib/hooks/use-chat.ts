import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../api/chat";

export const CHAT_KEYS = {
  conversations: ["chat", "conversations"] as const,
  conversation: (id: string) => ["chat", "conversations", id] as const,
  messages: (id: string, page?: number) => ["chat", "messages", id, page] as const,
};

export function useConversations() {
  return useQuery({
    queryKey: CHAT_KEYS.conversations,
    queryFn: () => chatApi.getConversations().then((r) => r.data),
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: CHAT_KEYS.conversation(id),
    queryFn: () => chatApi.getConversation(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useMessages(conversationId: string, page = 1) {
  return useQuery({
    queryKey: CHAT_KEYS.messages(conversationId, page),
    queryFn: () => chatApi.getMessages(conversationId, page).then((r) => r.data),
    enabled: !!conversationId,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ participantId, orderId }: { participantId: string; orderId?: string }) =>
      chatApi.createConversation(participantId, orderId).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CHAT_KEYS.conversations }),
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      chatApi.markAsRead(conversationId).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: CHAT_KEYS.conversations }),
  });
}
