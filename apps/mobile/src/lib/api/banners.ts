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
}

export const bannersApi = {
  getActive: (placement: BannerPlacement) =>
    apiClient.get<Banner[]>("/banners/active", { params: { placement } }),
};
