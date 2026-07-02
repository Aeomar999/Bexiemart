import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bannersApi, BannerPayload, BannerPlacement } from "../api/banners";

const BANNERS_KEY = "banners";

export function useBanners(page = 1, limit = 20, placement?: BannerPlacement) {
  return useQuery({
    queryKey: [BANNERS_KEY, page, limit, placement ?? "all"],
    queryFn: () => bannersApi.list(page, limit, placement),
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BannerPayload) => bannersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BANNERS_KEY] });
      toast.success("Banner created");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create banner");
    },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<BannerPayload> }) =>
      bannersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BANNERS_KEY] });
      toast.success("Banner updated");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update banner");
    },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bannersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BANNERS_KEY] });
      toast.success("Banner deleted");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete banner");
    },
  });
}
