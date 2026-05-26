import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reelsApi } from "../api/reels";

export function useReels() {
  return useQuery({
    queryKey: ["reels"],
    queryFn: () => reelsApi.getReels().then((r) => r.data),
  });
}

export function useFollowingReels() {
  return useQuery({
    queryKey: ["reels", "following"],
    queryFn: () => reelsApi.getFollowing().then((r) => r.data),
  });
}

export function useToggleReelLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reelsApi.toggleLike(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reels"] }),
  });
}

export function useIncrementReelView() {
  return useMutation({
    mutationFn: (id: string) => reelsApi.incrementView(id),
  });
}
