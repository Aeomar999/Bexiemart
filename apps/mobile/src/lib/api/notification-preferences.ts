import { apiClient } from "./client";

export interface NotificationPreferences {
  id?: string;
  userId?: string;
  newOrder: boolean;
  orderCancel: boolean;
  payout: boolean;
  chat: boolean;
  promo: boolean;
  email: boolean;
  sms: boolean;
}

export const notificationPreferencesApi = {
  get: () => apiClient.get<NotificationPreferences>("/notification-preferences"),
  update: (data: Partial<Omit<NotificationPreferences, "id" | "userId">>) =>
    apiClient.put<NotificationPreferences>("/notification-preferences", data),
};
