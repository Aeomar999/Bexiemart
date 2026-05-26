import { apiClient } from "./client";

export const addressesApi = {
  getAll: () => apiClient.get("/addresses"),

  create: (data: { type: string; name: string; address: string; city: string; phone: string; isDefault?: boolean }) =>
    apiClient.post("/addresses", data),

  update: (id: string, data: { type?: string; name?: string; address?: string; city?: string; phone?: string; isDefault?: boolean }) =>
    apiClient.put(`/addresses/${id}`, data),

  remove: (id: string) => apiClient.delete(`/addresses/${id}`),

  setDefault: (id: string) => apiClient.patch(`/addresses/${id}/default`),
};
