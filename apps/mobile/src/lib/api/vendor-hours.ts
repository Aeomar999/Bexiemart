import { apiClient } from "./client";

export const vendorHoursApi = {
  getAll: () => apiClient.get("/vendor/hours"),
  update: (data: any[]) => apiClient.put("/vendor/hours", data),
};
