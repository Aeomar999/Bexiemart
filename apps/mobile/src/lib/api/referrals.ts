import { apiClient } from "./client";
export const referralsApi = {
  getProfile: () => apiClient.get("/referrals"),
  generate: () => apiClient.post("/referrals/generate"),
  apply: (code: string) => apiClient.post("/referrals/apply", { code }),
  getStats: () => apiClient.get("/referrals/stats"),
};
