import { apiClient } from "./client";

export const vendorCustomersApi = {
  getAll: () => apiClient.get("/vendor/customers"),
  getOne: (id: string) => apiClient.get(`/vendor/customers/${id}`),
};
