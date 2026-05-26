import { apiClient } from "./client";

export const vendorServicesApi = {
  getAll: () => apiClient.get("/vendor/services"),
  getOne: (id: string) => apiClient.get(`/vendor/services/${id}`),
  create: (data: any) => apiClient.post("/vendor/services", data),
  update: (id: string, data: any) => apiClient.put(`/vendor/services/${id}`, data),
  remove: (id: string) => apiClient.delete(`/vendor/services/${id}`),
};
