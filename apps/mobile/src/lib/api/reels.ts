import { apiClient } from "./client";
export const reelsApi = {
  getReels: (cursor?: string) => apiClient.get("/reels", { params: { cursor } }),
  getFollowing: (cursor?: string) => apiClient.get("/reels/following", { params: { cursor } }),
  toggleLike: (id: string) => apiClient.post(`/reels/${id}/like`),
  incrementView: (id: string) => apiClient.post(`/reels/${id}/view`),
};
