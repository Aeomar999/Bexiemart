import { apiClient } from "./client";

export const vendorReelsApi = {
  getAll: () => apiClient.get("/vendor/reels"),
  getOne: (id: string) => apiClient.get(`/vendor/reels/${id}`),
  create: (data: any) => apiClient.post("/vendor/reels", data),
  update: (id: string, data: any) => apiClient.put(`/vendor/reels/${id}`, data),
  remove: (id: string) => apiClient.delete(`/vendor/reels/${id}`),
};
