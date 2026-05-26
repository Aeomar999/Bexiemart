import { apiClient } from "./client";

export const reviewsApi = {
  create: (data: { productId: string; rating: number; comment?: string }) =>
    apiClient.post("/reviews", data),

  findByProduct: (productId: string) => apiClient.get(`/reviews/product/${productId}`),

  getProductStats: (productId: string) => apiClient.get(`/reviews/product/${productId}/stats`),

  remove: (id: string) => apiClient.delete(`/reviews/${id}`),
};
