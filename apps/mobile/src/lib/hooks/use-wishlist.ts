import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wishlistApi } from "../api/wishlist";

export const WISHLIST_KEYS = {
  all: ["wishlist"] as const,
};

export function useWishlist() {
  return useQuery({
    queryKey: WISHLIST_KEYS.all,
    queryFn: () => wishlistApi.getWishlist().then((r) => r.data.data),
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => wishlistApi.toggleWishlist(productId).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEYS.all });
    },
  });
}
