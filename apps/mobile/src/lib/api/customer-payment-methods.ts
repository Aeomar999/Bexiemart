import { apiClient } from "./client";

export const customerPaymentMethodsApi = {
  getAll: () => apiClient.get("/payment-methods"),

  addCard: (data: {
    provider: string;
    details: string;
    holderName: string;
    expiry: string;
    isDefault?: boolean;
  }) => apiClient.post("/payment-methods/card", data),

  addMomo: (data: {
    provider: string;
    details: string;
    holderName: string;
    isDefault?: boolean;
  }) => apiClient.post("/payment-methods/momo", data),

  remove: (id: string) => apiClient.delete(`/payment-methods/${id}`),

  setDefault: (id: string) => apiClient.patch(`/payment-methods/${id}/default`),
};
