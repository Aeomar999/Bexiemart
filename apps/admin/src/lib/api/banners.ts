import { apiClient } from "./client";

export type BannerPlacement = "HOME" | "FOOD" | "SERVICES";

export interface Banner {
  id: string;
  placement: BannerPlacement;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  imageUrl: string;
  ctaLabel?: string | null;
  ctaRoute?: string | null;
  isActive: boolean;
  sortOrder: number;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BannerPayload {
  placement: BannerPlacement;
  title: string;
  subtitle?: string;
  badge?: string;
  imageUrl: string;
  ctaLabel?: string;
  ctaRoute?: string;
  isActive?: boolean;
  sortOrder?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const bannersApi = {
  list: async (page = 1, limit = 20, placement?: BannerPlacement) => {
    const { data } = await apiClient.get<PaginatedResponse<Banner>>("/admin/banners", {
      params: { page, limit, ...(placement ? { placement } : {}) },
    });
    return data;
  },

  create: async (payload: BannerPayload) => {
    const { data } = await apiClient.post<Banner>("/admin/banners", payload);
    return data;
  },

  update: async (id: string, payload: Partial<BannerPayload>) => {
    const { data } = await apiClient.patch<Banner>(`/admin/banners/${id}`, payload);
    return data;
  },

  remove: async (id: string) => {
    const { data } = await apiClient.delete(`/admin/banners/${id}`);
    return data;
  },
};
