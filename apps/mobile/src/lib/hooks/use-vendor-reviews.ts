import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorReviewsApi } from "../api/vendor-reviews";

export const KEYS = { all: ["vendor-reviews"] as const };

export function useVendorReviews() {
  return useQuery({ queryKey: KEYS.all, queryFn: () => vendorReviewsApi.getAll().then((r) => r.data) });
}

export function useReplyToReview() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, reply }: { id: string; reply: string }) => vendorReviewsApi.reply(id, reply), onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}
