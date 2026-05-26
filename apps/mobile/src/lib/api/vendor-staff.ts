import { apiClient } from "./client";

export const vendorStaffApi = {
  getAll: () => apiClient.get("/vendor/staff"),
  create: (data: any) => apiClient.post("/vendor/staff", data),
  update: (id: string, data: any) => apiClient.put(`/vendor/staff/${id}`, data),
  remove: (id: string) => apiClient.delete(`/vendor/staff/${id}`),
  toggle: (id: string) => apiClient.patch(`/vendor/staff/${id}/toggle`),
};
