import { apiClient } from "./client";

export const ordersApi = {
  create: (data: { shippingAddress: any; items?: any[] }) =>
    apiClient.post("/orders", data),

  getAll: () => apiClient.get("/orders"),

  getOne: (id: string) => apiClient.get(`/orders/${id}`),

  cancel: (id: string) => apiClient.post(`/orders/${id}/cancel`),
};
