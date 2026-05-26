import { apiClient } from "./client";
export const flashSalesApi = {
  getActive: () => apiClient.get("/flash-sales/active"),
};
