import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reelsApi } from "../api/reels";

export function useReels() {
  return useInfiniteQuery({
    queryKey: ["reels"],
    queryFn: ({ pageParam }) =>
      reelsApi.getReels(pageParam as string | undefined).then((r) => r.data),
    initialPageParam: undefined,
    getNextPageParam: (lastPage: any) => lastPage?.meta?.nextCursor ?? undefined,
  });
}

export function useFollowingReels() {
  return useInfiniteQuery({
    queryKey: ["reels", "following"],
    queryFn: ({ pageParam }) =>
      reelsApi.getFollowing(pageParam as string | undefined).then((r) => r.data),
    initialPageParam: undefined,
    getNextPageParam: (lastPage: any) => lastPage?.meta?.nextCursor ?? undefined,
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
