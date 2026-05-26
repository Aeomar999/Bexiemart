import { apiClient } from "./client";

export const chatApi = {
  getConversations: () => apiClient.get("/chat/conversations"),
  getConversation: (id: string) => apiClient.get(`/chat/conversations/${id}`),
  createConversation: (participantId: string, orderId?: string) =>
    apiClient.post("/chat/conversations", { participantId, orderId }),
  markAsRead: (id: string) => apiClient.post(`/chat/conversations/${id}/read`),
  getMessages: (id: string, page = 1) =>
    apiClient.get(`/chat/conversations/${id}/messages?page=${page}`),
};
