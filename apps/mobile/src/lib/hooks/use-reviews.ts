import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewsApi } from "../api/reviews";

export const REVIEW_KEYS = {
  all: ["reviews"] as const,
  product: (id: string) => ["reviews", "product", id] as const,
};

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { productId: string; rating: number; comment?: string }) =>
      reviewsApi.create(data).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: REVIEW_KEYS.product(variables.productId) });
    },
  });
}
