import { useQuery } from "@tanstack/react-query";
import { bannersApi, BannerPlacement } from "../api/banners";

export const BANNER_KEYS = {
  placement: (p: BannerPlacement) => ["banners", p] as const,
};

export function useBanners(placement: BannerPlacement) {
  return useQuery({
    queryKey: BANNER_KEYS.placement(placement),
    queryFn: () => bannersApi.getActive(placement).then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}
