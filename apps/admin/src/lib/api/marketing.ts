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

export const marketingApi = {
  getFlashSales: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get<PaginatedResponse<any>>("/admin/flash-sales", {
      params: { page, limit },
    });
    return data;
  },

  createFlashSale: async (payload: any) => {
    const { data } = await apiClient.post("/admin/flash-sales", payload);
    return data;
  },

  getCoupons: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get<PaginatedResponse<any>>("/admin/coupons", {
      params: { page, limit },
    });
    return data;
  },

  createCoupon: async (payload: any) => {
    const { data } = await apiClient.post("/admin/coupons", payload);
    return data;
  },
};
