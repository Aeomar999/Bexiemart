import { apiClient } from "./client";

export const vendorApi = {
  getProfile: () => apiClient.get("/vendor/profile"),

  getStats: () => apiClient.get("/vendor/stats"),

  getProducts: () => apiClient.get("/vendor/products"),
  createProduct: (data: any) => apiClient.post("/vendor/products", data),
  updateProduct: (id: string, data: any) => apiClient.put(`/vendor/products/${id}`, data),
  deleteProduct: (id: string) => apiClient.delete(`/vendor/products/${id}`),

  getOrders: (status?: string) => apiClient.get("/vendor/orders", { params: { status } }),
  getOrder: (id: string) => apiClient.get(`/vendor/orders/${id}`),
  updateOrderStatus: (id: string, status: string) => apiClient.patch(`/vendor/orders/${id}/status`, { status }),

  getEarnings: () => apiClient.get("/vendor/earnings"),
  getTransactions: () => apiClient.get("/vendor/earnings/transactions"),
  getAnalytics: () => apiClient.get("/vendor/earnings/analytics"),
  withdraw: (amount: number, destination: string) => apiClient.post("/vendor/earnings/withdraw", { amount, destination }),

  updateShop: (data: any) => apiClient.patch("/vendor/shop", data),
};
