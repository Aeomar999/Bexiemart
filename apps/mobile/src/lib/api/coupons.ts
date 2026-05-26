import { apiClient } from "./client";

export const couponsApi = {
  validate: (data: { code: string; orderAmount: number }) =>
    apiClient.post("/coupons/validate", data),
};
