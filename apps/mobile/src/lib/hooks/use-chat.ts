import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSocketStore } from "../stores/socket-store";
import { useAuthStore } from "../stores/auth-store";
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
    queryFn: () => chatApi.getMessages(conversationId, page).then((r) => r.data.data ?? r.data),
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

export function useChatMessages(conversationId: string, page = 1) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { socket, isConnected, enqueueMessage } = useSocketStore();
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  const messagesQuery = useMessages(conversationId, page);

  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit('join_conversation', { conversationId });

    const handleNewMessage = (message: any) => {
      qc.setQueryData(CHAT_KEYS.messages(conversationId, page), (oldData: any) => {
        if (!oldData) return oldData;
        const messages = Array.isArray(oldData) ? oldData : (oldData.messages || oldData.data || []);
        
        const exists = messages.find((m: any) => m.id === message.id);
        if (exists) return oldData;

        if (!Array.isArray(oldData)) {
          return { ...oldData, data: [message, ...messages] };
        }
        return [message, ...oldData];
      });
    };

    const handleTyping = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (data.conversationId === conversationId && data.userId !== user?.id) {
        setTypingUsers(prev => ({ ...prev, [data.userId]: data.isTyping }));
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('typing', handleTyping);

    return () => {
      socket.emit('leave_conversation', { conversationId });
      socket.off('new_message', handleNewMessage);
      socket.off('typing', handleTyping);
    };
  }, [socket, conversationId, page, qc, user?.id]);

  const sendMessage = useMutation({
    mutationFn: async (payload: { content?: string; type: 'TEXT' | 'IMAGE'; mediaUrl?: string }) => {
      const message = {
        conversationId,
        senderId: user?.id,
        ...payload,
        id: 'temp-' + Date.now(),
        createdAt: new Date().toISOString(),
        status: 'PENDING'
      };

      qc.setQueryData(CHAT_KEYS.messages(conversationId, page), (oldData: any) => {
        if (!oldData) return oldData;
        const messages = Array.isArray(oldData) ? oldData : (oldData.messages || oldData.data || []);
        if (!Array.isArray(oldData)) {
          return { ...oldData, data: [message, ...messages] };
        }
        return [message, ...oldData];
      });

      if (isConnected && socket) {
        socket.emit('send_message', { conversationId, ...payload });
      } else {
        enqueueMessage({ conversationId, ...payload });
      }
      return message;
    }
  });

  const sendTypingEvent = (isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit('typing', { conversationId, isTyping });
    }
  };

  return {
    data: messagesQuery.data,
    isLoading: messagesQuery.isLoading,
    sendMessage,
    sendTypingEvent,
    typingUsers,
  };
}
