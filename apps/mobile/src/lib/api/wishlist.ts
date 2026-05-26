import { apiClient } from "./client";

export const wishlistApi = {
  getWishlist: () => apiClient.get("/wishlist"),
  toggleWishlist: (productId: string) => apiClient.post(`/wishlist/${productId}/toggle`),
};
