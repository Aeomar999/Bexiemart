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

export const moderationApi = {
  getReels: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get<PaginatedResponse<any>>("/admin/content/reels", {
      params: { page, limit },
    });
    return data;
  },

  toggleReelStatus: async (id: string) => {
    const { data } = await apiClient.patch(`/admin/content/reels/${id}/toggle-status`);
    return data;
  },

  getReviews: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get<PaginatedResponse<any>>("/admin/content/reviews", {
      params: { page, limit },
    });
    return data;
  },

  deleteReview: async (id: string) => {
    const { data } = await apiClient.patch(`/admin/content/reviews/${id}/delete`);
    return data;
  },
};
