import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { moderationApi } from "../api/moderation";

export function useReels(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ["reels", page, limit],
    queryFn: () => moderationApi.getReels(page, limit),
  });
}

export function useToggleReelStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => moderationApi.toggleReelStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reels"] });
    },
  });
}

export function useReviews(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ["reviews", page, limit],
    queryFn: () => moderationApi.getReviews(page, limit),
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => moderationApi.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}
