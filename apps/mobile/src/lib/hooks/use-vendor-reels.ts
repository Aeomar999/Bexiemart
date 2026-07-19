import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorReelsApi } from "../api/vendor-reels";

export const KEYS = { all: ["vendor-reels"] as const };

export function useVendorReels() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: () => vendorReelsApi.getAll().then((r) => r.data),
  });
}

export interface CreateReelInput {
  videoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  productId?: string;
}

export function useCreateReel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReelInput) => vendorReelsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useDeleteReel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vendorReelsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
