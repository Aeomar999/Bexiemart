import { apiClient } from "./client";

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const foodApi = {
  getFoodVendors: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get<PaginatedResponse<any>>("/admin/food-vendors", {
      params: { page, limit },
    });
    return data;
  },

  getFoodOrders: async (page = 1, limit = 20, status?: string) => {
    const { data } = await apiClient.get<PaginatedResponse<any>>("/admin/food-orders", {
      params: { page, limit, status },
    });
    return data;
  },
};
