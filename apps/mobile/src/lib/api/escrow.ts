import { apiClient } from "./client";

export const escrowApi = {
  list: () => apiClient.get("/escrow"),
  get: (id: string) => apiClient.get(`/escrow/${id}`),
  dispute: (id: string, reason: string) => apiClient.post(`/escrow/${id}/dispute`, { reason }),
  release: (id: string) => apiClient.post(`/escrow/${id}/release`),
  refund: (id: string) => apiClient.post(`/escrow/${id}/refund`),
};
