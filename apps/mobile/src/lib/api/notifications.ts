import { apiClient } from "./client";

export const notificationsApi = {
  getAll: () => apiClient.get("/notifications"),

  getUnreadCount: () => apiClient.get("/notifications/unread-count"),

  markAsRead: (id: string) => apiClient.post(`/notifications/${id}/read`),

  markAllAsRead: () => apiClient.post("/notifications/read-all"),
};
