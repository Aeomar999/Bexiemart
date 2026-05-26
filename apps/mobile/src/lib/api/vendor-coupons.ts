import { apiClient } from "./client";

export const vendorCouponsApi = {
  getAll: () => apiClient.get("/vendor/coupons"),
  create: (data: any) => apiClient.post("/vendor/coupons", data),
  update: (id: string, data: any) => apiClient.put(`/vendor/coupons/${id}`, data),
  remove: (id: string) => apiClient.delete(`/vendor/coupons/${id}`),
  toggle: (id: string) => apiClient.patch(`/vendor/coupons/${id}/toggle`),
};
