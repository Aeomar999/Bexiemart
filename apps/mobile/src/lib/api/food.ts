import { apiClient } from "./client";
export const foodApi = {
  getRestaurants: (params?: { category?: string }) =>
    apiClient.get("/food/restaurants", { params }),
  getRestaurant: (id: string) => apiClient.get(`/food/restaurants/${id}`),
  getItems: (params?: { category?: string; search?: string }) =>
    apiClient.get("/food/items", { params }),
  getCart: () => apiClient.get("/food/cart"),
  addToCart: (data: { foodItemId: string; quantity: number; specialInstructions?: string }) =>
    apiClient.post("/food/cart/add", data),
  updateCartItem: (id: string, quantity: number) =>
    apiClient.put(`/food/cart/item/${id}`, { quantity }),
  removeCartItem: (id: string) => apiClient.delete(`/food/cart/item/${id}`),
  clearCart: () => apiClient.delete("/food/cart"),
  checkout: () => apiClient.post("/food/checkout"),
  getOrders: () => apiClient.get("/food/orders"),
  getOrder: (id: string) => apiClient.get(`/food/orders/${id}`),
};
