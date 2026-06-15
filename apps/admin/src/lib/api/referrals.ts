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

export const referralsApi = {
  getReferrals: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get<PaginatedResponse<any>>("/admin/referrals", {
      params: { page, limit },
    });
    return data;
  },
};
