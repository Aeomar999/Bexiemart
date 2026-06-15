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

export const servicesApi = {
  getServiceVendors: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get<PaginatedResponse<any>>("/admin/service-vendors", {
      params: { page, limit },
    });
    return data;
  },

  getServiceBookings: async (page = 1, limit = 20, status?: string) => {
    const { data } = await apiClient.get<PaginatedResponse<any>>("/admin/service-bookings", {
      params: { page, limit, status },
    });
    return data;
  },
};
