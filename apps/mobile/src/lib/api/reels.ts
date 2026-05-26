import { apiClient } from "./client";
export const reelsApi = {
  getReels: () => apiClient.get("/reels"),
  getFollowing: () => apiClient.get("/reels/following"),
  toggleLike: (id: string) => apiClient.post(`/reels/${id}/like`),
  incrementView: (id: string) => apiClient.post(`/reels/${id}/view`),
};
