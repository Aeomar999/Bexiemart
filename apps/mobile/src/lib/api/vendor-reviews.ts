import { apiClient } from "./client";

export const vendorReviewsApi = {
  getAll: () => apiClient.get("/vendor/reviews"),
  reply: (id: string, reply: string) => apiClient.post(`/vendor/reviews/${id}/reply`, { reply }),
};
