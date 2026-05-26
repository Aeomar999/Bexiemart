import { apiClient } from "./client";

export const vendorPaymentMethodsApi = {
  getAll: () => apiClient.get("/vendor/payment-methods"),
  addBank: (data: any) => apiClient.post("/vendor/payment-methods/bank", data),
  addMomo: (data: any) => apiClient.post("/vendor/payment-methods/momo", data),
  remove: (type: string, id: string) => apiClient.delete(`/vendor/payment-methods/${type}/${id}`),
  setDefault: (type: string, id: string) => apiClient.patch(`/vendor/payment-methods/${type}/${id}/default`),
};
