import { apiClient } from "./client";

export const vendorDocumentsApi = {
  getAll: () => apiClient.get("/vendor/documents"),
  create: (data: any) => apiClient.post("/vendor/documents", data),
  remove: (id: string) => apiClient.delete(`/vendor/documents/${id}`),
};

export const vendorAnalyticsApi = {
  getAnalytics: () => apiClient.get("/vendor/earnings/analytics"),
  getTransactions: () => apiClient.get("/vendor/earnings/transactions"),
};
