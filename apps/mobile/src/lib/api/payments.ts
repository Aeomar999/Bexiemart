import { apiClient } from "./client";

export const paymentsApi = {
  initialize: (data: { orderId: string; callbackUrl?: string }) =>
    apiClient.post("/payments/initialize", data),

  verify: (reference: string) => apiClient.get(`/payments/verify/${reference}`),
};
