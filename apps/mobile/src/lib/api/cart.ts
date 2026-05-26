import { apiClient } from "./client";

export const cartApi = {
  getCart: () => apiClient.get("/cart"),

  addItem: (productId: string, quantity: number) =>
    apiClient.post("/cart", { productId, quantity }),

  updateItem: (itemId: string, quantity: number) =>
    apiClient.put(`/cart/${itemId}`, { quantity }),

  removeItem: (itemId: string) => apiClient.delete(`/cart/${itemId}`),
};
